#!/usr/bin/env node
/**
 * 기사 자동 번역.
 *
 *   ANTHROPIC_API_KEY=... node scripts/translate-posts.mjs [--force] [--only <id>]
 *
 * 왜 CI 에서 도는가 — 관리자 페이지는 브라우저에서 도는 정적 화면이라 API 키를 둘
 * 곳이 없다. 번역은 커밋이 올라온 뒤 GitHub Actions 안에서 하고, 키는 저장소 시크릿에
 * 둔다. 그러면 관리자는 원문만 쓰면 되고 영문은 배포 과정에서 채워진다.
 *
 * 무엇을 다시 번역하는가 — 번역본에 남긴 `translatedFrom`(원문 해시)이 지금 원문의
 * 해시와 다를 때만. 관리자가 직접 손본 번역(`manual: true`)은 건드리지 않는다.
 */
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

import Anthropic from "@anthropic-ai/sdk"

const ROOT = path.resolve(import.meta.dirname, "..")
const NEWS_DIR = path.join(ROOT, "content", "data", "news")

const MODEL = "claude-sonnet-5"
const SOURCE_TO_TARGETS = { ko: ["en"], en: ["ko"] }
const LANG_NAME = { ko: "Korean", en: "English" }

const args = process.argv.slice(2)
const FORCE = args.includes("--force")
const ONLY = args.includes("--only") ? args[args.indexOf("--only") + 1] : null

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "ANTHROPIC_API_KEY 가 없어 번역을 건너뛴다. 저장소 시크릿에 넣으면 배포 때 자동으로 돈다."
  )
  process.exit(0)
}

const client = new Anthropic()

/* --------------------------------------------------------------- 해시 */

/**
 * 번역에 영향을 주는 부분만 해시한다. 이미지 경로나 날짜가 바뀌었다고 다시
 * 번역할 이유는 없다.
 */
function sourceHash(locale) {
  const payload = JSON.stringify({
    title: locale.title,
    summary: locale.summary,
    blocks: locale.blocks.map((b) =>
      b.type === "image"
        ? { type: "image", alt: b.alt, caption: b.caption ?? null }
        : b
    ),
  })
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16)
}

/* --------------------------------------------------------------- 번역 */

const SYSTEM = `You translate corporate news posts for HADD Science (하드사이언스), a Korean
biotech company. Its products are 3D cell culture hydrogels — ADDGEL and LiVEGEL — used for
organoid and spheroid culture.

Rules:
- Translate into natural, professional prose in the target language. Match the register of a
  company newsroom: factual, warm, never breathless.
- Keep these unchanged: ADDGEL, LiVEGEL, HADD Science, personal names (romanize Korean names
  in the standard Revised Romanization when translating to English), institution names
  (use the institution's own official English name when it has one).
- Keep technical terms accurate: 오가노이드 = organoid, 스페로이드 = spheroid,
  3차원 배양 = 3D culture, 하이드로겔 = hydrogel, 세포외기질 = extracellular matrix.
- Drop decorative emoji from titles; keep the meaning.
- Do not add, remove, merge or reorder blocks. Output exactly one entry per input block,
  in the same order.
- Leave a field out only if the input block does not have it.`

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    blocks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          cite: { type: "string" },
          alt: { type: "string" },
          caption: { type: "string" },
        },
        additionalProperties: false,
      },
    },
  },
  required: ["title", "summary", "blocks"],
  additionalProperties: false,
}

async function translate(locale, from, to) {
  const input = {
    title: locale.title,
    summary: locale.summary,
    blocks: locale.blocks.map((b) =>
      b.type === "image"
        ? { type: "image", alt: b.alt, ...(b.caption ? { caption: b.caption } : {}) }
        : b
    ),
  }

  const message = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Translate from ${LANG_NAME[from]} to ${LANG_NAME[to]}.\n\n${JSON.stringify(input, null, 2)}`,
      },
    ],
    output_config: {
      format: { type: "json_schema", schema: SCHEMA },
    },
  })

  const out = message.parsed_output
  if (!out) throw new Error("모델이 구조화된 결과를 내놓지 않았다")
  if (out.blocks.length !== locale.blocks.length) {
    throw new Error(
      `블록 수가 다르다 — 원문 ${locale.blocks.length}개, 번역 ${out.blocks.length}개`
    )
  }

  // 타입과 이미지 경로는 원문에서 그대로 가져온다. 모델이 손댈 여지를 두지 않는다.
  const blocks = locale.blocks.map((src, i) => {
    const t = out.blocks[i]
    if (src.type === "image") {
      return {
        type: "image",
        src: src.src,
        alt: t.alt ?? src.alt,
        ...(src.caption ? { caption: t.caption ?? src.caption } : {}),
      }
    }
    if (src.type === "quote") {
      return {
        type: "quote",
        text: t.text ?? src.text,
        ...(src.cite ? { cite: t.cite ?? src.cite } : {}),
      }
    }
    return { type: src.type, text: t.text ?? src.text }
  })

  return {
    title: out.title,
    summary: locale.summary ? out.summary : "",
    blocks,
    translatedFrom: sourceHash(locale),
  }
}

/* ----------------------------------------------------------------- 실행 */

const files = fs
  .readdirSync(NEWS_DIR)
  .filter((f) => f.endsWith(".json") && f !== "order.json")

let translated = 0
let skipped = 0
const failures = []

for (const file of files) {
  const id = file.replace(/\.json$/, "")
  if (ONLY && ONLY !== id) continue

  const filePath = path.join(NEWS_DIR, file)
  const post = JSON.parse(fs.readFileSync(filePath, "utf8"))
  const source = post.content[post.sourceLang]
  if (!source) {
    failures.push(`${id}: 원문(${post.sourceLang}) 로케일이 없다`)
    continue
  }

  const hash = sourceHash(source)
  let changed = false

  for (const target of SOURCE_TO_TARGETS[post.sourceLang] ?? []) {
    const existing = post.content[target]
    if (existing?.manual) {
      skipped++
      continue
    }
    if (!FORCE && existing?.translatedFrom === hash) {
      skipped++
      continue
    }

    try {
      process.stdout.write(`번역 ${id} ${post.sourceLang}→${target} … `)
      post.content[target] = await translate(source, post.sourceLang, target)
      changed = true
      translated++
      console.log("완료")
    } catch (err) {
      console.log("실패")
      failures.push(`${id} → ${target}: ${err.message}`)
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(post, null, 2) + "\n")
  }
}

console.log(`\n번역 ${translated}건, 건너뜀 ${skipped}건, 실패 ${failures.length}건`)
for (const f of failures) console.error(`  - ${f}`)

// 일부가 실패해도 성공한 번역은 커밋되게 둔다. 다만 종료 코드로 알린다.
if (failures.length) process.exit(1)

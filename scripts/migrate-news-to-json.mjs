/**
 * 기사를 TypeScript 배열에서 JSON 파일로 옮긴다. **일회용 마이그레이션이다.**
 *
 *   node --experimental-strip-types --import ./scripts/ts-loader.mjs \
 *     scripts/migrate-news-to-json.mjs
 *
 * 왜 JSON 인가
 *   관리자 페이지(CMS)가 기사를 읽고 써야 한다. TS 배열을 쓰려면 CMS 가 코드를
 *   파싱·생성해야 하고, 편집자의 실수 하나로 사이트 빌드가 통째로 깨진다.
 *   JSON 은 스키마로 검증할 수 있고 git diff 도 읽기 쉽다.
 *
 * 왜 글 하나에 파일 하나인가
 *   한 글을 고치면 파일 하나만 커밋된다. 되돌리기와 충돌 해결이 쉽고, 여러 사람이
 *   서로 다른 글을 동시에 편집해도 부딪히지 않는다.
 *
 * 왜 언어를 한 파일에 담는가
 *   언어별로 쪼개면 번역이 원문과 어긋난 채 커밋되는 상태가 만들어진다.
 *   한 파일에 두면 원문과 번역이 항상 같은 커밋에서 움직인다.
 */
import fs from "node:fs/promises"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const DEST = path.join(ROOT, "content", "data", "news")

const { AVAILABLE_LANGS, getContent } = await import(
  path.join(ROOT, "content", "index.ts")
)

/**
 * 아임웹 카드뉴스 이미지를 본문 블록으로 바꾼다.
 * 카드 안에 한국어 글자가 박혀 있어 언어 공용으로 쓸 수 없다 — 그래서 언어별 블록이다.
 */
const cardsToBlocks = (cards, title) =>
  (cards ?? []).map((src, i) => ({
    type: "image",
    src,
    alt: `${title} — ${i + 1}/${cards.length}`,
  }))

async function main() {
  await fs.mkdir(DEST, { recursive: true })

  const byLang = Object.fromEntries(
    AVAILABLE_LANGS.map((l) => [l, getContent(l).news.items])
  )
  const base = byLang[AVAILABLE_LANGS[0]]

  let withBody = 0
  const order = []

  for (const item of base) {
    const post = {
      id: item.id,
      date: item.date,
      /** 번역 원본 언어. CI 번역이 이 언어를 읽어 나머지를 채운다. */
      sourceLang: "ko",
      /** 목록 카드 썸네일. 언어 공통이다. */
      thumbnail: item.image,
      /**
       * 아직 본문을 옮기지 않은 글은 아임웹 원문으로 보낸다.
       * 본문(blocks)이 생기면 이 값을 null 로 바꾸고 사이트 안 상세 페이지를 쓴다.
       */
      externalHref: item.href.startsWith("http") ? item.href : null,
      content: {},
    }

    for (const lang of AVAILABLE_LANGS) {
      const l = byLang[lang].find((n) => n.id === item.id)
      if (!l) continue
      post.content[lang] = {
        title: l.title,
        /** 목록·검색·OG 에 쓰는 한두 문장. 아직 비어 있다 — 편집자가 채운다. */
        summary: "",
        /** text 블록은 자동 번역 대상, image 블록은 언어별로 직접 넣는다. */
        blocks: cardsToBlocks(l.cards, l.title),
      }
    }

    if (post.content.ko?.blocks?.length) withBody++
    order.push(post.id)

    await fs.writeFile(
      path.join(DEST, `${post.id}.json`),
      JSON.stringify(post, null, 2) + "\n"
    )
  }

  // 목록 순서. 파일명 정렬로는 원래 순서(최신순)를 복원할 수 없다.
  await fs.writeFile(
    path.join(DEST, "order.json"),
    JSON.stringify(order, null, 2) + "\n"
  )

  console.log(
    `기사 ${base.length}건 → content/data/news/*.json ` +
      `(본문 블록 있음 ${withBody}건, 외부 링크 ${base.length - withBody}건)`
  )
}

main()

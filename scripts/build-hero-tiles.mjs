/**
 * 랜딩 히어로 배경 타일을 만든다 (2×3 플립 그리드).
 *
 *   node scripts/build-hero-tiles.mjs                    # 채택안을 public/hero/tiles 에
 *   node scripts/build-hero-tiles.mjs --variant=a --out=/tmp/x   # 시안 비교용
 *
 * 사진 한 장당 타일 두 벌(와이드 `w-NN` · 세로 `p-NN`)을 굽고, 어느 사진이 어느 장면인지를
 * `content/hero-tiles.generated.json` 에 적는다. 어느 칸에 무엇을 띄울지는 이 파일이 아니라
 * 화면(`lib/hero-rotation.ts`)이 정한다 — 칸이 뒤집힐 때마다 **지금 떠 있는 장면과 겹치지
 * 않는 사진**을 고른다.
 *
 * 왜 장면(scene)인가 (2026-09-23)
 *   처음에는 서로 다른 파일 18장을 칸마다 세 장씩 고정했다. 파일은 달랐지만 연사로 찍힌
 *   거의 같은 컷이 여럿이라(무대 라인업 셋 · 무대 전경 둘 · 같은 보드 앞 단체 셋), 흐리게
 *   깔리면 같은 사진이 두 칸에 동시에 뜬 것처럼 보였다. 파일이 다르다는 것은 보는 사람에게
 *   아무 의미가 없다. 그래서 연사를 걷어내고, 남은 것 중 닮은 것끼리는 같은 장면으로 묶어
 *   동시에 뜨지 못하게 했다.
 *
 * 사진은 수상 기록이 중심이다 — 사용자 요청(2026-09-22) "최대한 상받는 사진으로".
 * 원본은 NAS 에 있고 레포에 넣지 않는다. 산출물만 public/hero/tiles/ 에 커밋한다.
 *
 * 디자인시스템과의 차이 (의도된 것)
 *   readme 의 VISUAL FOUNDATIONS 는 사진 배경을 금하고, 이 저장소의 README 는
 *   자동 재생 캐러셀을 금한다. 여기 쓰는 것은 스톡이 아닌 자사 기록이고, 플립은
 *   배경 텍스처에서만 일어나며 읽을 내용을 바꾸지 않는다(캐러셀은 콘텐츠를 바꾼다).
 *   prefers-reduced-motion 에서는 플립이 멈추고 첫 장만 남는다.
 */
import fs from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const ROOT = path.resolve(import.meta.dirname, "..")

const NAS = "/Users/jeong-uchang/NAS/HADD Science"
const AWARD = `${NAS}/09. 하드사이언스 사진/251125_2025 창업인큐베이팅 경진대회(장관상 대상)`
const BEST = `${NAS}/62. HADD 홈페이지/기사 원본 파일/우수사례_공모전_수상식_사진`
const US = `${NAS}/(2026) 아이코어 과제 수행폴더/미국/미국 사진첩/셀렉본`

/**
 * 수상 사진.
 *
 * `scene` 이 같은 사진은 화면에 동시에 뜨지 않는다. 연사처럼 흐린 배경에서 구별이 안 되는
 * 컷은 아예 한 장만 남겼고, 구별은 되지만 닮은 컷(같은 백드롭 앞 · 같은 무대 스크린 앞)은
 * 같은 장면으로 묶었다. 장면은 **7개 이상** 있어야 한다 — 여섯 칸에 떠 있는 장면을 피하고도
 * 다음 칸에 줄 장면이 남아야 하기 때문이다(아래 main 에서 확인한다).
 *
 * **앞의 여섯 장이 첫 화면이다.** 순서대로 칸 0~5 에 들어가므로 장면이 서로 달라야 하고,
 * 칸 0(제목 뒤)에는 어두운 무대 전경을 둔다.
 *
 * 장면 묶음은 **흐린 타일을 나란히 놓고 눈으로** 정했다. 파일 이름이나 원본으로 판단하면
 * 틀린다 — 원본에서는 달라 보이는 두 장(상장 사진 · 테이블 사인)이 같은 안내판이었다.
 *
 * 고른 기준: 무대·백드롭이 넓게 잡힌 장면. 얼굴이 화면을 채우는 셀피는 뺐다.
 * 시상식 사진에는 타사 수상자도 함께 찍혀 있다 — 블러 6 에서 윤곽이 남는 것은
 * 작업지시자가 괜찮다고 확인했다(2026-09-23).
 */
const PHOTOS = [
  // ── 첫 화면 (칸 0~5) ──
  { file: `${AWARD}/20251125_150236.jpg`, scene: "stage", note: "시상식 무대 전경" },
  { file: `${AWARD}/KakaoTalk_20251125_234755763_20.jpg`, scene: "infra", note: "대상 상장 · 지역창업인프라 백드롭" },
  { file: `${AWARD}/KakaoTalk_20251125_234755763_18.jpg`, scene: "title", note: "통합성과보고회 스크린" },
  { file: `${BEST}/우수사례공모전_정우창_최우수상_상패수여순간.jpeg`, scene: "best", note: "우수사례 공모전 최우수상 수여" },
  { file: `${AWARD}/KakaoTalk_20251126_203039301_05.jpg`, scene: "kobizma", note: "수상자 단체 · 성과보고회 보드" },
  { file: `${AWARD}/20251125_133446.jpg`, scene: "board", note: "대상 수상기업 보드 · 제품" },
  // ── 나머지 ──
  // 무대: 전경과 라인업은 같은 순간을 거리만 달리 찍은 것이라 흐리면 닮는다. 한 장면으로 묶는다.
  { file: `${AWARD}/KakaoTalk_20251125_234755763_14.jpg`, scene: "stage", note: "무대 · 대상 수상기업 라인업" },
  { file: `${AWARD}/KakaoTalk_20251125_234755763_17.jpg`, scene: "stage", note: "장관상 수상기업 라인업(가까이)" },
  { file: `${AWARD}/KakaoTalk_20251125_234755763_13.jpg`, scene: "stage", note: "대상 스크린 · 팻말 2인" },
  { file: `${AWARD}/KakaoTalk_20251125_184737586.jpg`, scene: "stage", note: "무대 · 대상 상장 수여" },
  // 안내판: 상장 옆에 선 것과 테이블 위의 것이 **같은 대상 안내판**(수상 5개사 목록)이다.
  // 따로 두었더니 흰 안내판 두 장이 나란히 떴다(2026-09-23 실측).
  { file: `${AWARD}/20251125_141544.jpg`, scene: "sign", note: "대상 안내판 · 테이블" },
  { file: `${AWARD}/20251125_150259.jpg`, scene: "sign", note: "대상 상장 · 안내판" },
  { file: `${BEST}/우수사례공모전_정우창_발표_Omnis소개.jpeg`, scene: "talk", note: "우수사례 공모전 발표 · Omnis" },
  { file: `${AWARD}/KakaoTalk_20251125_234755763_23.jpg`, scene: "infra", note: "대상 팻말 · 팀" },
  { file: `${AWARD}/KakaoTalk_20251125_212133885_03.jpg`, scene: "infra", note: "수상자 단체 · 지역창업인프라" },
  { file: `${BEST}/우수사례공모전_정우창_최우수상_수상기념사진.jpeg`, scene: "best", note: "최우수상 기념" },
  { file: `${BEST}/우수사례공모전_전체수상자_단체기념사진.jpeg`, scene: "best", note: "우수사례 전체 수상자" },
  { file: `${AWARD}/KakaoTalk_20251125_140459195.jpg`, scene: "board", note: "대상 수상기업 보드 · 2인" },
]

/** 활동 사진 — 혼합 시안(d)에서만 쓴다. 장면마다 하나씩이다. */
const WORK_PHOTOS = [
  { file: `${US}/20260618_104152.jpg`, scene: "work-lab", note: "실험실 · 벤치 작업" },
  { file: `${US}/20260622_153409.jpg`, scene: "work-bio", note: "BIO USA 코리아관 발표" },
  { file: `${US}/20260619_225337.jpg`, scene: "work-kasbp", note: "KASBP 심포지엄" },
  { file: `${US}/KakaoTalk_20260629_154226590_11.jpg`, scene: "work-meeting", note: "내부 미팅" },
  { file: `${US}/20260618_190040.jpg`, scene: "work-reception", note: "네트워킹 리셉션" },
]

/**
 * 시안.
 *
 * 사진을 어디까지 드러낼지가 갈림길이다. 히어로 위에는 h1 과 버튼이 올라가므로
 * 대비가 먼저고, 그다음이 "무엇이 찍혔는지 알아볼 수 있는가" 다.
 */
export const VARIANTS = {
  // A — 옛 콜라주와 같은 톤. 사진은 흐린 결로만 남는다. 가장 안전하다.
  a: { label: "A · 수상 · 깊은 블러", picks: "award", brightness: 0.42, saturation: 0.62, blur: 18, scrim: 0.26, duotone: false },
  // B — 블러를 줄여 "상 받는 장면"이 읽히게 한다. 채택안(2026-09-22).
  b: { label: "B · 수상 · 장면이 읽히는 톤(얕은 블러)", picks: "award", brightness: 0.5, saturation: 0.72, blur: 6, scrim: 0.3, duotone: false },
  // C — 네이비 듀오톤. 사진이 브랜드 색 하나로 통일돼 여섯 칸이 한 장처럼 읽힌다.
  c: { label: "C · 수상 · 네이비 듀오톤", picks: "award", brightness: 0.62, saturation: 1, blur: 8, scrim: 0.16, duotone: true },
  // D — 수상 + 활동 혼합. 상만 나열하지 않고 일하는 장면을 섞는다.
  d: { label: "D · 수상 + 활동 혼합", picks: "mix", brightness: 0.46, saturation: 0.66, blur: 10, scrim: 0.24, duotone: false },
}

/** 와이드는 3열 2행, 세로는 2열 3행. 둘 다 여섯 칸이고 칸 크기가 모두 같다. */
const LAYOUTS = {
  w: { cell: { width: 900, height: 760 } },
  p: { cell: { width: 620, height: 620 } },
}

/**
 * 제목·설명이 놓이는 자리에 히어로 그라디언트(`scroll-stage.tsx` 의 120° 네이비)가
 * 얼마나 짙게 깔리는지. 글자 영역 안에서 **가장 옅은 곳**의 값이다.
 *
 *   와이드 1440×900: 설명 둘째 줄 끝(≈530, 550) 에서 α ≈ 0.50
 *   세로   414×860: 설명 끝(≈390, 560) 에서 α ≈ 0.35
 *
 * 사진이 어느 칸에든 들어가므로, 모든 타일이 제목 아래 칸에 와도 버텨야 한다.
 */
const TEXT_SCRIM = { w: 0.5, p: 0.35 }
/**
 * 설명 문단은 `text-white/78` 이라 흰색보다 대비가 낮다. 가장 약한 글자를 기준으로 잰다.
 * 기준은 WCAG AA 본문 4.5:1.
 */
const TEXT_ALPHA = 0.78
const MIN_CONTRAST = 4.5

function poolFor(variant) {
  return variant.picks === "award" ? PHOTOS : [...PHOTOS, ...WORK_PHOTOS]
}

async function scrim(width, height, alpha) {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      // --brand-blue-900 #062E63
      background: { r: 6, g: 46, b: 99, alpha },
    },
  })
    .png()
    .toBuffer()
}

async function bake(pick, cell, variant, out) {
  let img = sharp(pick.file)
    .rotate() // EXIF 방향 반영. 안 하면 세로 사진이 눕는다.
    .resize({
      width: cell.width,
      height: cell.height,
      fit: "cover",
      position: sharp.strategy.attention,
    })

  if (variant.duotone) {
    // 흑백으로 눌러 놓고 네이비~블루 사이로 다시 칠한다. tint 만으로는 원색이 남는다.
    img = img.grayscale().tint({ r: 26, g: 74, b: 143 })
  }

  const base = await img.toBuffer()

  await sharp(base)
    .composite([{ input: await scrim(cell.width, cell.height, variant.scrim), blend: "over" }])
    .modulate({ brightness: variant.brightness, saturation: variant.saturation })
    .blur(variant.blur)
    .webp({ quality: 74 })
    .toFile(out)
}

const lin = (c) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

/**
 * 타일 위에 히어로 그라디언트(가장 옅은 곳)를 얹고, 설명 문단 색(흰 78%)과의 대비를
 * 화소마다 재서 가장 나쁜 값을 돌려준다. 블러가 끝난 타일이라 한두 화소의 튐은 없다.
 */
async function worstContrast(file, overlay) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const [nr, ng, nb] = [6, 46, 99]
  let worst = Infinity
  for (let i = 0; i < data.length; i += info.channels) {
    const bg = [0, 1, 2].map((k) => data[i + k] * (1 - overlay) + [nr, ng, nb][k] * overlay)
    const fg = bg.map((c) => 255 * TEXT_ALPHA + c * (1 - TEXT_ALPHA))
    const lb = lum(...bg)
    const lf = lum(...fg)
    const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05)
    if (ratio < worst) worst = ratio
  }
  return worst
}

async function buildVariant(key, outDir) {
  const variant = VARIANTS[key]
  if (!variant) throw new Error(`알 수 없는 시안: ${key}`)
  const pool = poolFor(variant)

  // 옛 산출물이 남으면(사진 수가 줄었을 때) 화면이 없는 번호를 찾지는 않지만 배포에 실린다.
  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(outDir, { recursive: true })

  let bytes = 0
  const report = []
  for (const [prefix, layout] of Object.entries(LAYOUTS)) {
    for (const [i, pick] of pool.entries()) {
      const out = path.join(outDir, `${prefix}-${String(i + 1).padStart(2, "0")}.webp`)
      await bake(pick, layout.cell, variant, out)
      bytes += (await fs.stat(out)).size
      report.push({ id: `${prefix}-${String(i + 1).padStart(2, "0")}`, note: pick.note, contrast: await worstContrast(out, TEXT_SCRIM[prefix]) })
    }
  }
  return { label: variant.label, kb: Math.round(bytes / 1024), pool, report }
}

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=")
      return [k, v ?? true]
    })
  )
  const key = typeof args.variant === "string" ? args.variant : "b"
  const outDir =
    typeof args.out === "string" ? args.out : path.join(ROOT, "public", "hero", "tiles")
  const live = outDir === path.join(ROOT, "public", "hero", "tiles")

  for (const pick of [...PHOTOS, ...WORK_PHOTOS]) {
    try {
      await fs.access(pick.file)
    } catch {
      console.error(`원본을 찾을 수 없다 (NAS 연결 확인): ${pick.file}`)
      process.exit(1)
    }
  }

  const pool = poolFor(VARIANTS[key] ?? VARIANTS.b)
  const scenes = new Set(pool.map((p) => p.scene))
  const first = new Set(pool.slice(0, 6).map((p) => p.scene))
  if (scenes.size < 7) {
    console.error(`장면이 ${scenes.size}개뿐이다. 여섯 칸을 피하고도 하나가 남으려면 7개 이상이어야 한다.`)
    process.exit(1)
  }
  if (first.size < 6) {
    console.error("앞의 여섯 장(첫 화면)에 같은 장면이 있다. 순서를 바꿀 것.")
    process.exit(1)
  }

  const { label, kb, report } = await buildVariant(key, outDir)
  console.log(`${label}\n  사진 ${pool.length}장 · 장면 ${scenes.size}개 · 타일 ${pool.length * 2}장 · ${kb}KB · ${outDir}\n`)

  const bad = report.filter((r) => r.contrast < MIN_CONTRAST)
  const min = report.reduce((a, b) => (a.contrast < b.contrast ? a : b))
  console.log(`설명 문단(흰 78%) 최저 대비 ${min.contrast.toFixed(2)}:1 — ${min.id} ${min.note}`)
  if (bad.length) {
    for (const r of bad) console.error(`  ✗ ${r.id} ${r.note}  ${r.contrast.toFixed(2)}:1`)
    console.error(`기준 ${MIN_CONTRAST}:1 미달. 사진을 빼거나 톤을 누를 것.`)
    process.exit(1)
  }

  // 화면이 읽는 목록. 파일 경로(NAS)는 넣지 않는다 — 클라이언트 번들에 실린다.
  if (live) {
    await fs.writeFile(
      path.join(ROOT, "content", "hero-tiles.generated.json"),
      JSON.stringify(pool.map((p) => ({ scene: p.scene })), null, 2) + "\n"
    )
    // public/ 안에 두면 배포 사이트로 그대로 나가 NAS 경로가 공개된다. 레포에만 남긴다.
    await fs.writeFile(
      path.join(ROOT, "scripts", "hero-tiles-sources.txt"),
      `랜딩 히어로 플립 그리드 원본 (NAS) — 시안 ${key.toUpperCase()}: ${label}\n` +
        "scripts/build-hero-tiles.mjs 로 생성. 사진을 바꾸려면 그 파일의 PHOTOS 를 고칠 것.\n\n" +
        pool.map((p, i) => `${String(i + 1).padStart(2, "0")}. [${p.scene}] ${p.note}\n    ${p.file}`).join("\n") +
        "\n"
    )
    console.log("content/hero-tiles.generated.json · scripts/hero-tiles-sources.txt 기록 완료")
  }
}

if (process.argv[1] === import.meta.filename) await main()

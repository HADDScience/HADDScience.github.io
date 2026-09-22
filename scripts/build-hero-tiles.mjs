/**
 * 랜딩 히어로 배경 타일을 만든다 (2×3 플립 그리드).
 *
 *   node scripts/build-hero-tiles.mjs                    # 채택안을 public/hero/tiles 에
 *   node scripts/build-hero-tiles.mjs --variant=b --out=/tmp/x   # 시안 비교용
 *
 * 2026-09-22 까지 쓰던 한 장짜리 콜라주(build-hero-collage.mjs, 지움)를 대신한다.
 * 셀 여섯 칸이 각각 사진 3장을 번갈아 보여주므로 한 칸당 3장 × 6칸 = 18장을
 * 두 벌(와이드·세로) 굽는다.
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
 * 수상 사진 18장 — **순서가 곧 배치다.** 세 장씩 끊어 칸 0~5 에 들어가고,
 * 같은 줄(칸의 n 번째)끼리가 한 화면에 함께 뜬다. 그래서 두 가지를 지켰다.
 *   · 18장 전부 서로 다른 사진 — 같은 사진이 두 칸에 동시에 뜨는 일이 없다.
 *   · 닮은 컷(단체 기념사진끼리, 무대 라인업끼리)을 같은 줄에 두지 않는다 —
 *     흐리게 깔리면 단체 사진 두 장은 거의 같은 그림으로 보인다.
 *
 * 고른 기준: 무대·백드롭이 넓게 잡힌 장면. 얼굴이 화면을 채우는 셀피와 상장 스캔은 뺐다.
 * 배경으로 깔리는 이미지에 특정 인물의 얼굴이 크게 박히면 시선을 빼앗는다.
 * 시상식 사진에는 타사 수상자도 함께 찍혀 있다 — 블러가 그 얼굴을 지운다는 전제이고,
 * 블러를 줄인 시안을 고른다면 그쪽 동의를 먼저 확인해야 한다.
 */
const AWARD_PICKS = [
  // 칸 0
  { file: `${AWARD}/KakaoTalk_20251125_234755763_14.jpg`, note: "시상식 무대 · 대상 수상기업" },
  { file: `${AWARD}/KakaoTalk_20251125_234755763_20.jpg`, note: "대상 상장 · 백드롭" },
  { file: `${AWARD}/20251125_150236.jpg`, note: "시상식 무대 전경" },
  // 칸 1
  { file: `${AWARD}/KakaoTalk_20251126_203039301_05.jpg`, note: "수상자 단체 기념사진" },
  { file: `${AWARD}/KakaoTalk_20251125_234755763_16.jpg`, note: "시상식 무대 · 상장 단체" },
  { file: `${BEST}/우수사례공모전_정우창_최우수상_상패수여순간.jpeg`, note: "우수사례 공모전 최우수상 수여" },
  // 칸 2
  { file: `${AWARD}/KakaoTalk_20251125_164039849_04.jpg`, note: "대상 상장 전달" },
  { file: `${AWARD}/KakaoTalk_20251125_212133885_03.jpg`, note: "수상자 단체 2" },
  { file: `${AWARD}/KakaoTalk_20251125_234755763_15.jpg`, note: "무대 라인업" },
  // 칸 3
  { file: `${BEST}/우수사례공모전_정우창_최우수상_수상기념사진.jpeg`, note: "최우수상 기념" },
  { file: `${AWARD}/KakaoTalk_20251125_234755763_17.jpg`, note: "장관상 수상기업 라인업" },
  { file: `${AWARD}/1764156900404.jpg`, note: "통합성과보고회 단체" },
  // 칸 4
  { file: `${AWARD}/KakaoTalk_20251125_184737586.jpg`, note: "대상 상장 수여" },
  { file: `${AWARD}/KakaoTalk_20251125_234755763_24.jpg`, note: "대상 상장 · 팀 기념" },
  { file: `${AWARD}/KakaoTalk_20251125_212133885_01.jpg`, note: "수상자 단체 3" },
  // 칸 5
  { file: `${AWARD}/KakaoTalk_20251125_234755763_23.jpg`, note: "대상 팻말 · 팀" },
  { file: `${BEST}/우수사례공모전_전체수상자_단체기념사진.jpeg`, note: "전체 수상자 단체" },
  { file: `${AWARD}/20251125_150303.jpg`, note: "시상식 무대 단체" },
]

/** 활동 사진 — 혼합 시안(d)에서만 쓴다. 기존 콜라주가 쓰던 것과 같은 컷이다. */
const WORK_PICKS = [
  { file: `${US}/20260618_104152.jpg`, note: "실험실 · 벤치 작업" },
  { file: `${US}/20260622_153409.jpg`, note: "BIO USA 코리아관 발표" },
  { file: `${US}/20260619_225337.jpg`, note: "KASBP 심포지엄" },
  { file: `${US}/KakaoTalk_20260629_154226590_11.jpg`, note: "내부 미팅" },
  { file: `${US}/20260618_190040.jpg`, note: "네트워킹 리셉션" },
]

/**
 * 시안.
 *
 * 사진을 어디까지 드러낼지가 갈림길이다. 히어로 위에는 h1 과 버튼이 올라가므로
 * 대비가 먼저고, 그다음이 "무엇이 찍혔는지 알아볼 수 있는가" 다.
 */
export const VARIANTS = {
  // A — 현행 콜라주와 같은 톤. 사진은 흐린 결로만 남는다. 가장 안전하다.
  a: {
    label: "A · 수상 · 현행 톤(깊은 블러)",
    picks: "award",
    brightness: 0.42,
    saturation: 0.62,
    blur: 18,
    scrim: 0.26,
    duotone: false,
  },
  // B — 블러를 줄여 "상 받는 장면"이 읽히게 한다. 요청의 취지에 가장 가깝다.
  b: {
    label: "B · 수상 · 장면이 읽히는 톤(얕은 블러)",
    picks: "award",
    brightness: 0.5,
    saturation: 0.72,
    blur: 6,
    scrim: 0.3,
    duotone: false,
  },
  // C — 네이비 듀오톤. 사진이 브랜드 색 하나로 통일돼 여섯 칸이 한 장처럼 읽힌다.
  c: {
    label: "C · 수상 · 네이비 듀오톤",
    picks: "award",
    brightness: 0.62,
    saturation: 1,
    blur: 8,
    scrim: 0.16,
    duotone: true,
  },
  // D — 수상 + 활동 혼합. 상만 나열하지 않고 일하는 장면을 섞는다.
  d: {
    label: "D · 수상 + 활동 혼합",
    picks: "mix",
    brightness: 0.46,
    saturation: 0.66,
    blur: 10,
    scrim: 0.24,
    duotone: false,
  },
}

/** 와이드는 3열 2행, 세로는 2열 3행. 둘 다 여섯 칸이다. */
const LAYOUTS = {
  w: { cols: 3, rows: 2, cell: { width: 900, height: 760 } },
  p: { cols: 2, rows: 3, cell: { width: 620, height: 620 } },
}

const TILES_PER_CELL = 3
const CELLS = 6
const TOTAL = CELLS * TILES_PER_CELL // 18

function poolFor(variant) {
  // 배열 순서가 그대로 타일 번호다(위 주석 참고). 섞지 않는다.
  if (variant.picks === "award") return AWARD_PICKS
  // 혼합 시안은 줄마다 한 장씩만 활동 사진으로 바꾼다 — 칸을 건너뛰며 바꿔야
  // 활동 사진이 한 줄에 몰리지 않는다.
  return AWARD_PICKS.map((pick, i) =>
    i % 5 === 0 ? WORK_PICKS[(i / 5) % WORK_PICKS.length] : pick
  )
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

async function buildVariant(key, outDir) {
  const variant = VARIANTS[key]
  if (!variant) throw new Error(`알 수 없는 시안: ${key}`)
  await fs.mkdir(outDir, { recursive: true })

  const pool = poolFor(variant)
  let bytes = 0
  for (const [prefix, layout] of Object.entries(LAYOUTS)) {
    for (let i = 0; i < TOTAL; i++) {
      const out = path.join(outDir, `${prefix}-${String(i + 1).padStart(2, "0")}.webp`)
      await bake(pool[i], layout.cell, variant, out)
      bytes += (await fs.stat(out)).size
    }
  }
  return { label: variant.label, kb: Math.round(bytes / 1024), pool }
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

  for (const pick of [...AWARD_PICKS, ...WORK_PICKS]) {
    try {
      await fs.access(pick.file)
    } catch {
      console.error(`원본을 찾을 수 없다 (NAS 연결 확인): ${pick.file}`)
      process.exit(1)
    }
  }

  const { label, kb, pool } = await buildVariant(key, outDir)
  console.log(`${label}\n  ${TOTAL * 2}장 · ${kb}KB · ${outDir}`)

  // public/ 안에 두면 배포 사이트로 그대로 나가 NAS 경로가 공개된다. 레포에만 남긴다.
  if (outDir.startsWith(path.join(ROOT, "public"))) {
    const seen = new Map()
    for (const p of pool) seen.set(p.file, p.note)
    await fs.writeFile(
      path.join(ROOT, "scripts", "hero-tiles-sources.txt"),
      `랜딩 히어로 플립 그리드 원본 (NAS) — 시안 ${key.toUpperCase()}: ${label}\n` +
        "scripts/build-hero-tiles.mjs 로 생성. 사진을 바꾸려면 그 파일의 PICKS 를 고칠 것.\n\n" +
        [...seen].map(([file, note], i) => `${i + 1}. ${note}\n   ${file}`).join("\n") +
        "\n"
    )
    console.log("scripts/hero-tiles-sources.txt 기록 완료")
  }
}

if (process.argv[1] === import.meta.filename) await main()

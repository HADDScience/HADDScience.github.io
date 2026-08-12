/**
 * 랜딩 히어로 배경 콜라주를 만든다.
 *
 *   node scripts/build-hero-collage.mjs
 *
 * 사내 사진에서 "활동하고 있는 모습" 6장을 골라 한 장으로 합치고, 네이비 스크림을
 * 씌워 어둡게 만든다. 사진이 대놓고 드러나지 않고 브랜드 네이비가 먼저 읽혀야 한다.
 *
 * 디자인시스템과의 차이 (의도된 것)
 *   readme 의 VISUAL FOUNDATIONS 는 "No patterns, no textures, no stock-photo
 *   backgrounds" 라고 못박는다. 여기서 쓰는 것은 스톡이 아니라 **자사 활동 사진**이고,
 *   네이비 스크림 아래 텍스처처럼 깔리므로 페이지는 여전히 네이비로 읽힌다.
 *   사용자 요청(2026-08-12)에 따른 의도적 확장이며, 히어로 한 곳에만 쓴다.
 *
 * 사진 원본은 NAS 에 있고 레포에 넣지 않는다. 산출물만 public/hero/ 에 커밋한다.
 * 사진을 바꾸려면 아래 PICKS 를 고치고 다시 돌린다.
 */
import fs from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const ROOT = path.resolve(import.meta.dirname, "..")
const DEST = path.join(ROOT, "public", "hero")

const NAS = "/Users/jeong-uchang/NAS/HADD Science"
const US = `${NAS}/(2026) 아이코어 과제 수행폴더/미국/미국 사진첩/셀렉본`
const AWARD = `${NAS}/09. 하드사이언스 사진/251125_2025 창업인큐베이팅 경진대회(장관상 대상)`

/**
 * 고른 기준: 와이드한 활동 장면. 얼굴이 화면을 채우는 셀피는 배제했다.
 * 배경으로 깔리는 이미지에 특정 인물의 얼굴이 크게 박히면 시선을 빼앗고,
 * 인물 사진을 배경 텍스처로 쓰는 것도 적절하지 않다.
 */
const PICKS = [
  { file: `${US}/20260618_104152.jpg`, note: "실험실 · 벤치 작업" },
  { file: `${AWARD}/20251125_150404.jpg`, note: "수상식 무대 · 창업인큐베이팅 대상" },
  { file: `${US}/20260622_153409.jpg`, note: "BIO USA 코리아관 발표" },
  { file: `${US}/20260619_225337.jpg`, note: "KASBP 심포지엄 · 네트워킹" },
  { file: `${US}/KakaoTalk_20260629_154226590_11.jpg`, note: "내부 미팅" },
  { file: `${US}/20260618_190040.jpg`, note: "Aquillius 네트워킹 리셉션" },
]

/** 와이드: 한 장을 크게 두고 나머지를 붙이는 편집형 배치. 균등 격자는 컨택트시트처럼 보인다. */
const WIDE = {
  width: 2400,
  height: 1350,
  cells: [
    { left: 0, top: 0, width: 1000, height: 1350 },
    { left: 1000, top: 0, width: 700, height: 675 },
    { left: 1700, top: 0, width: 700, height: 675 },
    { left: 1000, top: 675, width: 466, height: 675 },
    { left: 1466, top: 675, width: 467, height: 675 },
    { left: 1933, top: 675, width: 467, height: 675 },
  ],
}

/** 세로: 모바일. 6장을 넣으면 답답해서 4장만 쓴다. */
const PORTRAIT = {
  width: 1200,
  height: 1600,
  cells: [
    { left: 0, top: 0, width: 1200, height: 700 },
    { left: 0, top: 700, width: 600, height: 450 },
    { left: 600, top: 700, width: 600, height: 450 },
    { left: 0, top: 1150, width: 1200, height: 450 },
  ],
}

/**
 * 네이비 스크림.
 *
 * 처음에는 alpha 0.62 로 강하게 덮어 파란 워시처럼 보였다. 사용자 피드백("반투명 파랑
 * 말고 투명에 블러로")에 따라 워시를 크게 줄이고, 대신 **블러와 밝기**로 사진을
 * 눌러 배경으로 물러나게 한다. 파란 기운은 남기되 색면이 아니라 사진의 흐린 결로 읽힌다.
 */
async function scrim(width, height) {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      // --brand-blue-900 #062E63
      background: { r: 6, g: 46, b: 99, alpha: 0.26 },
    },
  })
    .png()
    .toBuffer()
}

async function compose({ width, height, cells }, picks, out) {
  const tiles = []
  for (const [i, cell] of cells.entries()) {
    const pick = picks[i % picks.length]
    const buf = await sharp(pick.file)
      .rotate() // EXIF 방향 반영. 안 하면 세로 사진이 눕는다.
      .resize({
        width: cell.width,
        height: cell.height,
        fit: "cover",
        position: sharp.strategy.attention,
      })
      .toBuffer()
    tiles.push({ input: buf, left: cell.left, top: cell.top })
  }

  await sharp({
    create: { width, height, channels: 3, background: "#062E63" },
  })
    .composite([
      ...tiles,
      { input: await scrim(width, height), blend: "over" },
    ])
    // 색면 대신 밝기로 누른다. 대비는 여기서 확보한다.
    .modulate({ brightness: 0.42, saturation: 0.62 })
    // 블러가 이 배경의 주된 성격이다. 사진의 세부가 사라지고 흐린 결만 남는다.
    .blur(18)
    .webp({ quality: 76 })
    .toFile(out)

  const meta = await sharp(out).metadata()
  const stat = await fs.stat(out)
  return { width: meta.width, height: meta.height, kb: Math.round(stat.size / 1024) }
}

async function main() {
  await fs.mkdir(DEST, { recursive: true })

  for (const pick of PICKS) {
    try {
      await fs.access(pick.file)
    } catch {
      console.error(`원본을 찾을 수 없다 (NAS 연결 확인): ${pick.file}`)
      process.exit(1)
    }
  }

  const wide = await compose(WIDE, PICKS, path.join(DEST, "collage-wide.webp"))
  console.log(`collage-wide.webp     ${wide.width}x${wide.height}  ${wide.kb}KB`)

  const portrait = await compose(
    PORTRAIT,
    // 세로에는 큰 장면 위주로 4장
    [PICKS[0], PICKS[1], PICKS[2], PICKS[3]],
    path.join(DEST, "collage-portrait.webp")
  )
  console.log(`collage-portrait.webp ${portrait.width}x${portrait.height}  ${portrait.kb}KB`)

  // public/ 안에 두면 배포 사이트로 그대로 나가 NAS 경로가 공개된다. 레포에만 남긴다.
  await fs.writeFile(
    path.join(ROOT, "scripts", "hero-collage-sources.txt"),
    "랜딩 히어로 배경 콜라주 원본 (NAS)\n" +
      "scripts/build-hero-collage.mjs 로 생성. 사진을 바꾸려면 그 파일의 PICKS 를 고칠 것.\n\n" +
      PICKS.map((p, i) => `${i + 1}. ${p.note}\n   ${p.file}`).join("\n") +
      "\n"
  )
  console.log("\nscripts/hero-collage-sources.txt 기록 완료")
}

main()

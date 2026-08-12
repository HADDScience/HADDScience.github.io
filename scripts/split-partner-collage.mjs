/**
 * haddscience.com 파트너 섹션은 로고를 한 장으로 합친 이미지다.
 * 그 콜라주를 행·열 투영으로 잘라 개별 로고로 만들고 배경을 투명하게 한다.
 *
 *   node scripts/split-partner-collage.mjs <콜라주 이미지> [--dry]
 *
 * 왜 투영(projection profiling)인가
 *   로고가 격자로 놓여 있어서, 완전히 흰 가로줄이 행 경계이고 흰 세로줄이 열 경계다.
 *   연결요소 라벨링보다 단순하고, 글자와 심볼이 떨어져 있어도 한 덩어리로 잡힌다.
 *
 * 배경 투명화
 *   원본이 흰 바탕이라 밝기 임계값으로 알파를 만든다. 경계에서 계단이 생기지 않도록
 *   임계값 사이는 부분 투명으로 둔다. 로고 안쪽의 흰 글자까지 뚫릴 수 있으므로
 *   결과는 반드시 눈으로 확인할 것 (--dry 로 좌표만 먼저 확인 가능).
 */
import fs from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const ROOT = path.resolve(import.meta.dirname, "..")
const DEST = path.join(ROOT, "public", "partners", "site")

/** 흰색으로 볼 밝기 하한. 이보다 밝으면 배경으로 간주한다. */
const WHITE = 244
/** 로고로 인정할 최소 크기(픽셀). 먼지·압축 노이즈를 걸러낸다. */
const MIN_W = 40
const MIN_H = 18
/** 잘라낸 뒤 남길 여백 */
const PAD = 6

/** 밝기 맵을 만든다. 알파가 있으면 투명은 배경으로 본다. */
async function luminanceMap(file) {
  const img = sharp(file).ensureAlpha()
  const { width, height } = await img.metadata()
  const raw = await img.raw().toBuffer()
  const lum = new Uint8Array(width * height)
  for (let i = 0, p = 0; i < raw.length; i += 4, p++) {
    const a = raw[i + 3]
    if (a < 8) {
      lum[p] = 255
      continue
    }
    lum[p] = (raw[i] * 299 + raw[i + 1] * 587 + raw[i + 2] * 114) / 1000
  }
  return { lum, width, height }
}

/** 값이 있는(=흰색이 아닌) 구간들을 찾는다. gap 이하의 빈틈은 하나로 잇는다. */
function segments(counts, gap) {
  const runs = []
  let start = -1
  let blank = 0
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] > 0) {
      if (start < 0) start = i
      blank = 0
    } else if (start >= 0) {
      blank++
      if (blank > gap) {
        runs.push([start, i - blank])
        start = -1
        blank = 0
      }
    }
  }
  if (start >= 0) runs.push([start, counts.length - 1])
  return runs
}

async function main() {
  const src = process.argv[2]
  const dry = process.argv.includes("--dry")
  if (!src) {
    console.error("사용법: node scripts/split-partner-collage.mjs <콜라주 이미지> [--dry]")
    process.exit(1)
  }

  const { lum, width, height } = await luminanceMap(src)
  const ink = (x, y) => (lum[y * width + x] < WHITE ? 1 : 0)

  // 행 분리 — 세로 방향 투영
  const rowCounts = new Array(height).fill(0)
  for (let y = 0; y < height; y++) {
    let c = 0
    for (let x = 0; x < width; x++) c += ink(x, y)
    rowCounts[y] = c
  }
  // 행 사이 여백은 넉넉하므로 gap 을 크게 준다 (로고 내부 줄간격과 구분)
  const rows = segments(rowCounts, Math.round(height * 0.012)).filter(
    ([a, b]) => b - a >= MIN_H
  )

  const boxes = []
  for (const [y0, y1] of rows) {
    const colCounts = new Array(width).fill(0)
    for (let x = 0; x < width; x++) {
      let c = 0
      for (let y = y0; y <= y1; y++) c += ink(x, y)
      colCounts[x] = c
    }
    // 열 사이 여백은 로고 내부 자간보다 훨씬 크다
    const cols = segments(colCounts, Math.round(width * 0.018)).filter(
      ([a, b]) => b - a >= MIN_W
    )
    for (const [x0, x1] of cols) {
      // 셀 안에서 실제 잉크가 있는 범위로 한 번 더 조인다
      let top = y1
      let bottom = y0
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          if (ink(x, y)) {
            if (y < top) top = y
            if (y > bottom) bottom = y
            break
          }
        }
      }
      boxes.push({
        left: Math.max(0, x0 - PAD),
        top: Math.max(0, top - PAD),
        width: Math.min(width, x1 + PAD) - Math.max(0, x0 - PAD),
        height: Math.min(height, bottom + PAD) - Math.max(0, top - PAD),
      })
    }
  }

  console.log(`행 ${rows.length}개, 로고 ${boxes.length}개 검출`)
  boxes.forEach((b, i) =>
    console.log(`  ${String(i + 1).padStart(2)} ${b.left},${b.top} ${b.width}x${b.height}`)
  )
  if (dry) return

  await fs.rm(DEST, { recursive: true, force: true })
  await fs.mkdir(DEST, { recursive: true })

  for (const [i, box] of boxes.entries()) {
    const name = String(i + 1).padStart(2, "0")
    const crop = await sharp(src).extract(box).ensureAlpha().raw().toBuffer()

    // 밝기로 알파를 만든다. WHITE 이상은 완전 투명, 그보다 어두우면 서서히 불투명.
    const SOFT = 24
    for (let p = 0; p < crop.length; p += 4) {
      const l = (crop[p] * 299 + crop[p + 1] * 587 + crop[p + 2] * 114) / 1000
      if (l >= WHITE) crop[p + 3] = 0
      else if (l > WHITE - SOFT)
        crop[p + 3] = Math.round(((WHITE - l) / SOFT) * crop[p + 3])
    }

    await sharp(crop, { raw: { width: box.width, height: box.height, channels: 4 } })
      .trim({ threshold: 1 })
      .resize({ height: 120, withoutEnlargement: true })
      .webp({ quality: 92, alphaQuality: 100 })
      .toFile(path.join(DEST, `${name}.webp`))
  }

  console.log(`\npublic/partners/site/ 에 ${boxes.length}개 저장`)
}

main()

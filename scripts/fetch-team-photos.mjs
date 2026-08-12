/**
 * haddscience.com/Team 의 인물 사진을 가져와 public/team/ 으로 옮긴다.
 *
 *   node scripts/fetch-team-photos.mjs
 *
 * 사진↔인물 짝은 라이브 페이지의 DOM 에서 카드 단위로 확인해 확정한 것이다.
 * 정우창·주용석은 한 컨테이너에 묶여 있어 x 좌표로 좌(정우창)·우(주용석)를 갈랐다.
 */
import fs from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const ROOT = path.resolve(import.meta.dirname, "..")
const DEST = path.join(ROOT, "public", "team")
const BASE = "https://cdn.imweb.me/thumbnail/"

const PHOTOS = [
  ["neuro-h", "20250318/1449d1af5d78d.png"],
  ["kh", "20240717/bf6679b053319.png"],
  ["yh", "20240718/5cdbe4b5bf009.png"],
  ["ari", "20250318/32375bd9f87cc.jpg"],
  ["noh", "20250318/9710de4a33635.jpg"],
  ["sojeong-park", "20260313/b54ce323287c4.jpg"],
  ["woochang-jung", "20260221/919996d3fa1a3.png"],
  ["yongseok-ju", "20260221/a896c20c9ea50.jpg"],
]

/**
 * 카드 비율에 맞춰 자른다.
 *
 * 이 사진들은 증명사진이 아니라 인물의 무드를 담은 사진이다(대부분 뒷모습·풍경).
 * 그래서 north 로 위쪽을 고정하면 하늘만 남는 경우가 생긴다. sharp 의 attention
 * 전략은 대비·채도가 높은 영역을 골라 잘라서 이런 사진에 맞다.
 */
const W = 800
const H = 600

async function main() {
  await fs.mkdir(DEST, { recursive: true })
  const manifest = []

  for (const [id, file] of PHOTOS) {
    const res = await fetch(BASE + file, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
        referer: "https://www.haddscience.com/",
      },
    })
    if (!res.ok) {
      console.error(`  ! ${id} ${res.status}`)
      continue
    }
    const buf = Buffer.from(await res.arrayBuffer())
    const info = await sharp(buf)
      .resize({ width: W, height: H, fit: "cover", position: sharp.strategy.attention })
      .webp({ quality: 84 })
      .toFile(path.join(DEST, `${id}.webp`))
    manifest.push({ id, src: `/team/${id}.webp`, width: info.width, height: info.height })
    console.log(`${id.padEnd(16)} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`)
  }

  await fs.writeFile(
    path.join(ROOT, "content", "team-photos.generated.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  )
  console.log(`\n${manifest.length}장 저장`)
}

main()

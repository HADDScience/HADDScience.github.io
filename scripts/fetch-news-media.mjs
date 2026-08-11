/**
 * 아임웹 CDN 에 남아 있던 뉴스 미디어를 프로젝트 안으로 가져온다.
 *
 *   pnpm media:news
 *
 * - 썸네일 48장  -> public/news/thumb/<id>.webp   (가로 800)
 * - 카드뉴스 82장 -> public/news/<id>/NN.webp      (최대 1080)
 * - 결과 매니페스트 -> content/news-media.generated.json
 *
 * 정적 배포(GitHub Pages / Synology Web Station)에서는 next/image 최적화가 돌지 않으므로
 * 여기서 미리 리사이즈해 둔다. 한 번 받아두면 아임웹을 해지해도 사이트가 살아 있다.
 */
import fs from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const ROOT = path.resolve(import.meta.dirname, "..")
const PUBLIC_NEWS = path.join(ROOT, "public", "news")

/** 본문(카드뉴스) 이미지를 가진 게시글. 크롤링으로 수집한 실제 URL. */
const CARD_SETS = {
  "172288285": [
    "5e62212cbca99.jpg", "c7ea3dd3391dd.jpg", "87f4b4d1d4569.jpg", "55d67e21f1dba.jpg",
    "b2d17d4689b12.jpg", "96b4de32e0b64.jpg", "f58c5d6d4e61f.jpg", "5e99bd545d40a.jpg",
  ],
  "172288167": [
    "71ab91e67330d.jpg", "bd6c97797227c.jpg", "d50c9cebb6681.jpg", "64d917c382a0c.jpg",
    "69aa70b341729.jpg", "60b4fd8d77eb7.jpg", "c132f493a847d.jpg", "079d91b90033a.jpg",
    "6290b4fd5480e.jpg",
  ],
  "172288085": [
    "33108402e8651.jpg", "8cca07c580024.jpg", "6f3986e6edb49.jpg", "f071de5ca676b.jpg",
    "a12e921ca1611.jpg", "536667c52de22.jpg", "6cf8e2e31a0dc.jpg", "5f7783a4f8afb.jpg",
  ],
  "172090251": [
    "429a8e50c0bd9.jpeg", "ad6534e9c6497.jpeg", "d1ab670f86f60.jpeg", "b5e2ecd6a817b.jpeg",
    "acd66e52ad52c.jpeg", "1bb2c3e8571a5.jpeg",
  ],
  "172090197": [
    "030dbf972c288.jpeg", "a603a36e7043b.jpeg", "7a5ca07e56442.jpeg", "23d34b2c78521.jpeg",
    "882cec0e7a6af.jpeg", "8ec1f167095e2.jpeg", "db07af283ed12.jpeg",
  ],
  "172090069": [
    "a4e9e94df723f.jpeg", "10460f4570e82.jpeg", "479e0c9eea95d.png", "dee6863ec584b.jpeg",
    "c05292d26e4a6.jpeg", "f4c26fbabd234.jpeg", "ad372739caa18.jpeg",
  ],
  "171780067": [
    "257630e06472f.jpeg", "983a4716cd6b1.jpeg", "1be3b09587b71.jpeg", "9abb913858a96.jpeg",
    "a3a5094d3ace8.jpeg", "966e6258538ee.jpeg", "344e7c66421d2.jpeg", "d22e69336f3f1.jpeg",
    "ab08cea117548.jpeg",
  ],
  "171397323": [
    "75983c3098cfe.jpg", "1daa0ed080876.jpg", "dabdc40b431de.jpg", "6c170799dead4.jpg",
    "9778a75af91c2.jpg", "37099eacd5ca4.jpg", "acd0ab58903ef.png",
  ],
  "171402558": [
    "6774eb3798979.jpg", "a19cecfc1bcdd.jpg", "28798ba82fd17.jpg", "d84ebe4ab3db9.jpg",
    "797d83b163727.jpg", "9be24c803ce23.jpg", "dc4049138325b.jpg", "cb499edda62df.jpg",
    "f6e8f280af5ef.jpg", "0b39a0df2137e.jpg", "fb2afd1c36007.jpg", "24f2e3f5d2f6e.jpg",
    "339dd02aacfdd.png",
  ],
  "171327290": [
    "386be4aaeeab3.jpg", "cc1b3613247c7.jpg", "ab5bce9dd3c8b.jpg", "bb4068e5efbfd.jpg",
    "abad28b64a212.jpg", "578b0ccf877a6.jpg", "9197d9782835f.jpg", "e901b88e61c6a.png",
  ],
}

const UPLOAD_BASE = "https://cdn.imweb.me/upload/S20240607cd090e8ba7a58/"

async function download(url) {
  const res = await fetch(url, {
    headers: {
      // 아임웹 CDN 은 일반 브라우저 헤더를 기대한다.
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
      accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      referer: "https://www.haddscience.com/",
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function toWebp(buffer, out, maxWidth) {
  await fs.mkdir(path.dirname(out), { recursive: true })
  return sharp(buffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(out)
}

/** news.ko.ts 에서 id + 아임웹 썸네일 URL 을 뽑는다. */
async function readThumbnailSources() {
  const src = await fs.readFile(path.join(ROOT, "content", "news.ko.ts"), "utf8")
  const items = []
  const re = /\{ id: "(\d+)",[^}]*?image:\s*"(https:\/\/cdn\.imweb\.me[^"]+)"/g
  let m
  while ((m = re.exec(src))) items.push({ id: m[1], url: m[2] })
  return items
}

async function main() {
  const manifest = { thumbs: {}, cards: {} }
  let ok = 0
  let failed = 0

  const thumbs = await readThumbnailSources()
  if (thumbs.length === 0) {
    console.log("썸네일 소스가 없다. 이미 로컬 경로로 교체된 상태로 보인다.")
  }
  console.log(`썸네일 ${thumbs.length}장`)
  for (const { id, url } of thumbs) {
    const out = path.join(PUBLIC_NEWS, "thumb", `${id}.webp`)
    try {
      const info = await toWebp(await download(url), out, 800)
      manifest.thumbs[id] = `/news/thumb/${id}.webp`
      ok++
      process.stdout.write(`  ${id} ${info.width}x${info.height}\n`)
    } catch (err) {
      failed++
      console.error(`  ! ${id} ${err.message}`)
    }
  }

  const total = Object.values(CARD_SETS).flat().length
  console.log(`카드뉴스 ${total}장`)
  for (const [id, files] of Object.entries(CARD_SETS)) {
    const paths = []
    for (const [i, file] of files.entries()) {
      const name = String(i + 1).padStart(2, "0")
      const out = path.join(PUBLIC_NEWS, id, `${name}.webp`)
      try {
        await toWebp(await download(UPLOAD_BASE + file), out, 1080)
        paths.push(`/news/${id}/${name}.webp`)
        ok++
      } catch (err) {
        failed++
        console.error(`  ! ${id}/${name} ${err.message}`)
      }
    }
    manifest.cards[id] = paths
    console.log(`  ${id} ${paths.length}/${files.length}`)
  }

  await fs.writeFile(
    path.join(ROOT, "content", "news-media.generated.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  )

  console.log(`\n완료: ${ok}장 성공, ${failed}장 실패`)
  if (failed > 0) process.exitCode = 1
}

main()

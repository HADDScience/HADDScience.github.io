/**
 * 공유·검색 결과에 뜨는 OG 이미지(1200×630)를 만든다.
 *
 *   node scripts/build-og-image.mjs
 *
 * 히어로 타일(수상 사진) 위에 네이비 그라디언트와 로고·한 줄 설명을 얹는다.
 * `scripts/build-hero-tiles.mjs` 를 먼저 돌려 `public/hero/tiles/` 가 있어야 한다.
 *
 * 왜 헤드리스 크롬인가
 *   글꼴이 Pretendard Variable 인데 저장소에는 **woff2 한 벌만** 있다. sharp 의 SVG
 *   렌더러도, next/og(satori)도 woff2 를 읽지 못한다(satori 는 ttf·otf·woff 만 받는다).
 *   브라우저는 읽는다. 결과물이 정적 PNG 한 장이고 배포 때 다시 만들 일이 없으므로,
 *   빌드 파이프라인에 넣지 않고 손으로 돌리는 스크립트로 둔다 — 히어로 타일과 같은 성격이다.
 *
 * 크롬 경로는 CHROME 환경변수로 바꿀 수 있다.
 */
import { execFileSync } from "node:child_process"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import sharp from "sharp"

const ROOT = path.resolve(import.meta.dirname, "..")
const OUT = path.join(ROOT, "public", "og", "hadd-og.png")
const CHROME =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

/** 배경에 쓸 타일. 시상식 무대가 크게 잡힌 칸을 고른다. */
const TILE = path.join(ROOT, "public", "hero", "tiles", "w-01.webp")
const LOGO = path.join(ROOT, "public", "logo", "logo-white.png")
const FONT = path.join(ROOT, "app", "fonts", "PretendardVariable.woff2")

const b64 = async (file, mime) =>
  `data:${mime};base64,${(await fs.readFile(file)).toString("base64")}`

async function html() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: Pretendard; src: url("${await b64(FONT, "font/woff2")}") format("woff2"); font-weight: 45 920; }
    * { margin: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; overflow: hidden; font-family: Pretendard, sans-serif; }
    .card { position: relative; width: 1200px; height: 630px; background: #062E63; }
    .shot { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    /* 히어로와 같은 120° 네이비 그라디언트. 글자가 놓이는 왼쪽을 더 누른다. */
    .scrim { position: absolute; inset: 0; background: linear-gradient(120deg, rgba(6,46,99,.90) 0%, rgba(6,46,99,.62) 58%, rgba(8,116,181,.38) 100%); }
    .body { position: absolute; inset: 0; padding: 72px 80px; display: flex; flex-direction: column; justify-content: space-between; color: #fff; }
    .logo { height: 34px; width: auto; }
    h1 { font-size: 66px; line-height: 1.14; letter-spacing: -0.035em; font-weight: 800; }
    .en { margin-top: 22px; font-size: 27px; letter-spacing: -0.01em; color: rgba(255,255,255,.80); }
    .foot { display: flex; align-items: center; gap: 14px; font-size: 22px; font-weight: 700; letter-spacing: .02em; color: rgba(255,255,255,.72); }
    .rule { width: 56px; height: 2px; background: #0874B5; }
  </style></head><body>
    <div class="card">
      <img class="shot" src="${await b64(TILE, "image/webp")}">
      <div class="scrim"></div>
      <div class="body">
        <img class="logo" src="${await b64(LOGO, "image/png")}">
        <div>
          <h1>오가노이드 · 3D 세포배양<br>생체소재를 만듭니다</h1>
          <div class="en">Organoid &amp; 3D cell culture biomaterials — ADDGEL · LiVEGEL</div>
        </div>
        <div class="foot"><span class="rule"></span>하드사이언스 HADD SCIENCE · haddscience.com</div>
      </div>
    </div>
  </body></html>`
}

const tmp = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "hadd-og-")), "og.html")
await fs.writeFile(tmp, await html())
await fs.mkdir(path.dirname(OUT), { recursive: true })

execFileSync(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--window-size=1200,630",
  `--screenshot=${OUT}`,
  // 폰트가 붙고 그림이 디코드될 시간을 준다. 없으면 글자가 기본 글꼴로 찍힌다.
  "--virtual-time-budget=3000",
  `file://${tmp}`,
])

// 크롬이 뱉는 PNG 는 사진 한 장을 무압축에 가깝게 담아 440KB 쯤 된다. 공유 카드 한 장에
// 그만큼 쓸 이유가 없으므로 팔레트로 다시 굽는다(육안 차이 없음, 1/3 크기).
await sharp(await fs.readFile(OUT)).png({ palette: true, quality: 90, effort: 9 }).toFile(OUT)

const { size } = await fs.stat(OUT)
console.log(`public/og/hadd-og.png  1200x630  ${Math.round(size / 1024)}KB`)

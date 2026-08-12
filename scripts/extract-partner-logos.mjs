/**
 * 사내 PPT 에서 협력 파트너 로고를 추출해 public/partners/ 로 옮긴다.
 *
 *   node scripts/extract-partner-logos.mjs "<pptx 경로>"
 *
 * pptx 는 zip 이라 ppt/media/ 에 원본 이미지가 그대로 들어 있다. PPT 를 새로 받으면
 * MEDIA 매핑만 갱신하고 다시 돌리면 된다.
 *
 * - 높이 120px 로 정규화한다 (표시 크기 32~40px 의 3배). 폭은 비율대로 둔다.
 * - 알파를 보존한다. 로고 배경이 흰 사각형으로 보이면 안 된다.
 * - SVG 원본은 래스터화하지 않고 그대로 복사한다.
 */
import fs from "node:fs/promises"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import sharp from "sharp"

const run = promisify(execFile)
const ROOT = path.resolve(import.meta.dirname, "..")
const DEST = path.join(ROOT, "public", "partners")

/**
 * PPT 미디어 파일 → 파트너 식별자 · 표기명.
 * 이름은 로고 아트워크에 인쇄된 표기를 그대로 옮겼다.
 *
 * 제외한 항목
 *   image1, image7  하드사이언스 자사 로고
 *   image2          장식용 세로 바
 *   image25         주황색 M 마크. 어떤 기관인지 식별 불가 (78×77 저해상도, 텍스트 없음)
 *   image36         실적 차트 스크린샷
 */
const MEDIA = [
  ["image3.jpeg", "skku", "성균관대학교"],
  ["image4.png", "snu-medicine", "서울대학교 의과대학"],
  ["image5.png", "kbri", "한국뇌연구원"],
  ["image6.png", "ulsan", "울산대학교"],
  ["image8.png", "sm-kukil-graphene", "SM국일그래핀"],
  ["image9.png", "biospero", "BioSpero"],
  ["image10.png", "eas", "EAS Electronic Auto System"],
  ["image11.png", "gachon-medicine", "가천대학교 의과대학"],
  ["image12.png", "dadalab", "DADALAB"],
  ["image13.png", "binaree", "BINAREE"],
  ["image14.png", "chungnam-medicine", "충남대학교 의과대학"],
  ["image15.png", "kbio-company", "KBIO COMPANY"],
  ["image16.png", "chain", "CHAIN"],
  ["image17.png", "kh-medicare", "KH MEDICARE"],
  ["image18.png", "orient-bio", "오리엔트바이오"],
  ["image19.png", "glofle", "glofle"],
  ["image20.png", "bonitolab", "BONITOLAB"],
  ["image21.png", "ajou-hospital", "아주대학교병원"],
  ["image22.png", "suwon", "수원대학교"],
  ["image23.png", "mifi", "발효미생물산업진흥원"],
  ["image24.png", "woojung-bio", "우정바이오"],
  ["image26.svg", "harvard-medical", "Harvard Medical School"],
  ["image27.jpeg", "houston-medicine", "University of Houston College of Medicine"],
  ["image28.svg", "miami-miller", "Miller School of Medicine, University of Miami"],
  ["image29.svg", "nexel", "NEXEL"],
  ["image30.svg", "hanwha-solutions", "한화솔루션"],
  ["image31.png", "jeju-veterinary", "제주대학교 수의학과"],
  ["image32.svg", "harvard", "Harvard University"],
  ["image33.png", "boston", "Boston University"],
  ["image34.svg", "kist", "한국과학기술연구원"],
  ["image35.png", "meditec", "메디텍"],
]

const TARGET_HEIGHT = 120

async function main() {
  const pptx = process.argv[2]
  if (!pptx) {
    console.error('사용법: node scripts/extract-partner-logos.mjs "<pptx 경로>"')
    process.exit(1)
  }

  const tmp = await fs.mkdtemp(path.join(await fs.realpath("/tmp"), "pptx-"))
  await run("unzip", ["-q", pptx, "-d", tmp])
  const media = path.join(tmp, "ppt", "media")

  await fs.mkdir(DEST, { recursive: true })
  const manifest = []

  for (const [file, id, name] of MEDIA) {
    const src = path.join(media, file)
    const isSvg = file.endsWith(".svg")
    const out = path.join(DEST, `${id}.${isSvg ? "svg" : "webp"}`)

    if (isSvg) {
      // 벡터는 그대로 둔다. 어떤 크기에서도 선명하다.
      await fs.copyFile(src, out)
      const { width, height } = await sharp(src).metadata()
      manifest.push({ id, name, src: `/partners/${id}.svg`, width, height })
      console.log(`${id.padEnd(22)} svg  ${width}x${height}`)
      continue
    }

    const info = await sharp(src)
      .trim({ threshold: 1 }) // 로고 주변 여백 제거 — 띠에서 크기가 고르게 보인다
      .resize({ height: TARGET_HEIGHT, withoutEnlargement: true })
      .webp({ quality: 92, alphaQuality: 100 })
      .toFile(out)
    manifest.push({
      id,
      name,
      src: `/partners/${id}.webp`,
      width: info.width,
      height: info.height,
    })
    console.log(`${id.padEnd(22)} webp ${info.width}x${info.height}`)
  }

  await fs.writeFile(
    path.join(ROOT, "content", "partners.generated.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  )
  await fs.rm(tmp, { recursive: true, force: true })
  console.log(`\n${manifest.length}개 로고를 public/partners/ 로 옮겼다.`)
}

main()

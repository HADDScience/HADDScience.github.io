/**
 * 정적 export 산출물(`out/`)을 정적 호스팅에 올릴 수 있는 상태로 마감한다.
 *
 *   pnpm build                      # 실서비스용 (색인 허용 + sitemap)
 *   DEPLOY_TARGET=pages pnpm build  # 컨펌용 GitHub Pages (색인 차단)
 *
 * 1. `.nojekyll` — GitHub Pages 는 Jekyll 을 기본 적용하고 `_` 로 시작하는 폴더를
 *    무시한다. 이 파일이 없으면 Next 의 `_next/` 전체가 404 가 되어 CSS·JS 가 사라진다.
 * 2. `index.html` — 루트에는 페이지가 없다(모든 라우트가 `/[lang]/` 아래). 서버가 없어
 *    `proxy.ts` 리다이렉트가 돌지 않으므로 브라우저 언어를 보고 보내는 문서를 만든다.
 * 3. `robots.txt` — 대상에 따라 갈린다. 아래 INDEXING 주석 참고.
 * 4. `sitemap.xml` — 실서비스 빌드에만 생성한다.
 */
import fs from "node:fs/promises"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const OUT = path.join(ROOT, "out")

const DEFAULT_LANG = "ko"
const LANGS = ["ko", "en"]

/**
 * INDEXING
 *
 * GitHub Pages 배포는 대표님 컨펌용이다. 조직 플랜이 free 라 레포가 공개여야 하고,
 * 따라서 haddscience.github.io 도 누구나 볼 수 있다. 이게 검색엔진에 잡히면 실도메인
 * haddscience.com 과 같은 내용으로 경쟁하는 중복 콘텐츠가 된다.
 *
 * 그래서 컨펌용 빌드에서는 robots.txt 로 차단하고, robots.txt 를 무시하는 크롤러까지
 * 막기 위해 모든 HTML 에 noindex 메타를 주입한다. 실서비스 빌드에서는 둘 다 하지 않는다.
 */
const IS_REVIEW_BUILD = process.env.DEPLOY_TARGET === "pages"
const SITE_URL = process.env.SITE_URL ?? "https://haddscience.com"

const rootHtml = `<!doctype html>
<html lang="${DEFAULT_LANG}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
${IS_REVIEW_BUILD ? '    <meta name="robots" content="noindex, nofollow" />\n' : ""}    <title>HADD SCIENCE</title>
    <link rel="canonical" href="/${DEFAULT_LANG}/" />
${LANGS.map((l) => `    <link rel="alternate" hreflang="${l}" href="/${l}/" />`).join("\n")}
    <link rel="alternate" hreflang="x-default" href="/${DEFAULT_LANG}/" />
    <script>
      // 브라우저 언어가 영어면 /en/, 그 외에는 /ko/ 로 보낸다.
      (function () {
        var langs = ${JSON.stringify(LANGS)};
        var pref = (navigator.languages || [navigator.language || ""])
          .map(function (t) { return String(t).toLowerCase(); });
        var target = "${DEFAULT_LANG}";
        for (var i = 0; i < pref.length; i++) {
          var hit = langs.filter(function (l) { return pref[i].indexOf(l) === 0; })[0];
          if (hit) { target = hit; break; }
        }
        location.replace("/" + target + "/");
      })();
    </script>
    <!-- JS 가 막힌 환경(크롤러 일부)을 위한 폴백 -->
    <noscript>
      <meta http-equiv="refresh" content="0; url=/${DEFAULT_LANG}/" />
    </noscript>
  </head>
  <body>
    <p>Redirecting to <a href="/${DEFAULT_LANG}/">/${DEFAULT_LANG}/</a>…</p>
  </body>
</html>
`

async function exists(p) {
  return fs
    .access(p)
    .then(() => true)
    .catch(() => false)
}

/** out/ 안의 모든 .html 경로를 모은다. */
async function htmlFiles(dir, acc = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) await htmlFiles(p, acc)
    else if (entry.name.endsWith(".html")) acc.push(p)
  }
  return acc
}

async function injectNoindex(files) {
  let touched = 0
  for (const file of files) {
    const html = await fs.readFile(file, "utf8")
    if (html.includes('name="robots"')) continue
    if (!html.includes("</head>")) continue
    await fs.writeFile(
      file,
      html.replace("</head>", '<meta name="robots" content="noindex, nofollow"/></head>')
    )
    touched++
  }
  return touched
}

/** 라우트별 index.html 경로에서 사이트맵 URL 을 만든다. */
function sitemapFrom(files) {
  const urls = files
    .filter((f) => path.basename(f) === "index.html")
    .map((f) => path.relative(OUT, path.dirname(f)))
    .filter((rel) => rel !== "" && !rel.startsWith("_") && !rel.startsWith("404"))
    .map((rel) => `${SITE_URL}/${rel.split(path.sep).join("/")}/`)
    .sort()

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
    "\n</urlset>\n"
  )
}

async function main() {
  if (!(await exists(OUT))) {
    console.error('out/ 이 없다. `output: "export"` 로 빌드했는지 확인할 것.')
    process.exit(1)
  }

  await fs.writeFile(path.join(OUT, ".nojekyll"), "")
  await fs.writeFile(path.join(OUT, "index.html"), rootHtml)

  const files = await htmlFiles(OUT)

  if (IS_REVIEW_BUILD) {
    await fs.writeFile(
      path.join(OUT, "robots.txt"),
      "# 대표님 컨펌용 배포. 실도메인과 중복 색인되지 않도록 전면 차단한다.\nUser-agent: *\nDisallow: /\n"
    )
    const touched = await injectNoindex(files)
    console.log(`postbuild(pages): robots Disallow + noindex 주입 ${touched}개`)
  } else {
    await fs.writeFile(
      path.join(OUT, "robots.txt"),
      `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
    )
    await fs.writeFile(path.join(OUT, "sitemap.xml"), sitemapFrom(files))
    console.log("postbuild(production): robots Allow + sitemap.xml 생성")
  }

  const checks = [
    ".nojekyll",
    "index.html",
    "404.html",
    "robots.txt",
    "_next",
    `${DEFAULT_LANG}/index.html`,
    "en/index.html",
  ]
  const missing = []
  for (const c of checks) if (!(await exists(path.join(OUT, c)))) missing.push(c)

  if (missing.length) {
    console.error(`out/ 에 누락이 있다: ${missing.join(", ")}`)
    process.exit(1)
  }

  console.log(`postbuild: HTML ${files.length}개, 필수 항목 ${checks.length}개 확인`)
}

main()

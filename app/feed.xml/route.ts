import { DEFAULT_LANG } from "@/content"
import { getContent, getPostLocale, hasArticle, listPosts } from "@/content/server"
import { absoluteUrl, isoDate, pageUrl } from "@/lib/seo"
import { IS_REVIEW_BUILD } from "@/lib/site-env"

/**
 * RSS 2.0 피드. 네이버 서치어드바이저가 사이트맵과 별개로 RSS 수집을 받는다 —
 * 새 글이 올라온 것을 알리는 통로가 하나 더 생긴다.
 *
 * 한국어만 낸다. 영문 기사는 대부분 자동 번역본이고, 피드는 "새 글 알림"이 목적이라
 * 같은 글이 두 언어로 두 번 도는 것은 이득이 없다.
 */

const LANG = DEFAULT_LANG
const LIMIT = 30

/** XML 텍스트에 그대로 들어가면 안 되는 다섯 글자. 기사 제목에 `&` 와 따옴표가 실제로 온다. */
function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** `2026.08.27` → RFC 822. 형식이 어긋나면 `undefined` — 날짜를 지어내지 않는다. */
function rfc822(date: string): string | undefined {
  const iso = isoDate(date)
  if (!iso) return undefined
  // 시각 정보가 없다. 한국 시간 자정으로 고정해 같은 글이 볼 때마다 다른 시각으로 보이지 않게 한다.
  return new Date(`${iso}T00:00:00+09:00`).toUTCString()
}

export async function GET() {
  const content = await getContent(LANG)
  const self = absoluteUrl("/feed.xml")
  const home = pageUrl(LANG, "/")

  // 컨펌용 배포는 색인을 전부 막는다. 피드만 살아 있으면 그 통로로 기사가 새어 나간다.
  const posts = IS_REVIEW_BUILD
    ? []
    : (await listPosts())
        .filter((post) => hasArticle(post, LANG))
        // 목록 순서는 고정 글이 맨 앞이라 피드에 쓰면 옛 글이 새 글처럼 보인다. 날짜로 다시 세운다.
        .sort((a, b) => (isoDate(b.date) ?? "").localeCompare(isoDate(a.date) ?? ""))
        .slice(0, LIMIT)

  const items = posts.map((post) => {
    const locale = getPostLocale(post, LANG)
    const link = pageUrl(LANG, `/${post.category === "library" ? "library" : "news"}/${post.id}`)
    const pubDate = rfc822(post.date)
    return [
      "    <item>",
      `      <title>${xml(locale?.title ?? post.id)}</title>`,
      `      <link>${xml(link)}</link>`,
      // guid 는 영원히 바뀌지 않아야 중복으로 다시 수집되지 않는다. 주소가 곧 식별자다.
      `      <guid isPermaLink="true">${xml(link)}</guid>`,
      ...(pubDate ? [`      <pubDate>${xml(pubDate)}</pubDate>`] : []),
      ...(locale?.summary ? [`      <description>${xml(locale.summary)}</description>`] : []),
      "    </item>",
    ].join("\n")
  })

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xml(content.meta.title)}</title>`,
    `    <link>${xml(home)}</link>`,
    `    <description>${xml(content.meta.description)}</description>`,
    `    <language>${LANG}</language>`,
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${xml(self)}" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n")

  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  })
}

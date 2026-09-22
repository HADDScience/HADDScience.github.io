import type { MetadataRoute } from "next"

import { AVAILABLE_LANGS } from "@/content"
import { hasArticle, listPosts } from "@/content/server"
import { isoDate, languageAlternates, pageUrl } from "@/lib/seo"
import { IS_REVIEW_BUILD } from "@/lib/site-env"

/**
 * `app/[lang]` 트리와 1:1 로 맞춘 목록(2026-09-22 대조).
 *
 * 쪽나누기(`/news/page/2` · `/library/page/2` …)는 일부러 뺀다 — 그 페이지들은
 * `robots: { index: false, follow: true }` 라 사이트맵에 넣으면 "색인하라고 냈는데
 * 색인하지 말라고 적힌" 모순된 신호가 된다.
 */
const STATIC_PATHS = [
  "/",
  "/about",
  "/about/team",
  "/about/location",
  "/products",
  "/products/livegel",
  "/news",
  "/library",
  "/contact",
  "/terms",
  "/privacy",
]

/** 실서비스에만 낸다. 컨펌용은 robots 가 전부 막으므로 사이트맵도 비운다. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (IS_REVIEW_BUILD) return []
  const posts = await listPosts()
  const urls: MetadataRoute.Sitemap = []

  for (const lang of AVAILABLE_LANGS) {
    for (const path of STATIC_PATHS) {
      // 언어 짝을 사이트맵에도 적는다. <head> 의 hreflang 과 같은 말을 두 번 하는
      // 셈이지만, 구글은 둘 중 아무거나 먼저 본 쪽을 쓴다 — 한쪽만 있으면 놓친다.
      urls.push({ url: pageUrl(lang, path), alternates: { languages: languageAlternates(path) } })
    }

    for (const post of posts) {
      if (!hasArticle(post, lang)) continue
      const path = `/${post.category === "library" ? "library" : "news"}/${post.id}`
      const lastModified = isoDate(post.date)
      urls.push({
        url: pageUrl(lang, path),
        // 날짜 형식이 어긋나면 생략한다. 틀린 lastmod 는 크롤러에게 거짓을 말하는 것이고,
        // 한 번 어긋나면 다음부터 이 값을 믿지 않는다.
        ...(lastModified ? { lastModified } : {}),
        // 번역이 없는 기사도 `getPostLocale` 이 원문으로 대체하므로 두 언어 모두
        // 실제로 열린다. 그래서 언어 짝을 그대로 적어도 죽은 주소가 생기지 않는다.
        alternates: { languages: languageAlternates(path) },
      })
    }
  }

  return urls
}

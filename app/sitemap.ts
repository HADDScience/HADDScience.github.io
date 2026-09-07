import type { MetadataRoute } from "next"

import { AVAILABLE_LANGS } from "@/content"
import { hasArticle, listPosts } from "@/content/server"
import { IS_REVIEW_BUILD, SITE_URL } from "@/lib/site-env"

const STATIC_PATHS = [
  "",
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
    for (const p of STATIC_PATHS) urls.push({ url: `${SITE_URL}/${lang}${p}/` })
    for (const post of posts) {
      if (hasArticle(post, lang)) urls.push({ url: `${SITE_URL}/${lang}/news/${post.id}/` })
    }
  }
  return urls
}

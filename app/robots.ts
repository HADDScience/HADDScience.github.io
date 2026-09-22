import type { MetadataRoute } from "next"

import { IS_REVIEW_BUILD, SITE_URL } from "@/lib/site-env"

/**
 * 컨펌용 배포(DEPLOY_TARGET=pages)는 전부 막는다 — 실도메인과 같은 내용으로 경쟁하는
 * 중복 콘텐츠가 되지 않게. 실서비스는 /admin 만 막는다. 관리 화면은 사내용이다.
 *
 * RSS(`/feed.xml`)는 여기 적지 않는다. `sitemap` 필드는 사이트맵 전용이고, 피드 주소를
 * 거기 넣으면 크롤러가 사이트맵으로 읽다 실패한다. 피드는 네이버 서치어드바이저에
 * 손으로 제출한다 — `docs/검색엔진-등록.md`.
 */
export default function robots(): MetadataRoute.Robots {
  if (IS_REVIEW_BUILD) return { rules: { userAgent: "*", disallow: "/" } }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}

/**
 * 배포 대상에 따라 갈리는 값. 예전에는 scripts/postbuild.mjs 가 정적 산출물에 심었다.
 * 서버 렌더로 바뀌면서 robots · sitemap · <meta robots> 가 이 값을 읽는다.
 */

/** 컨펌용 배포. 색인을 막는다. Vercel 프로젝트 환경변수 DEPLOY_TARGET=pages. */
export const IS_REVIEW_BUILD = process.env.DEPLOY_TARGET === "pages"

export const SITE_URL = process.env.SITE_URL ?? "https://haddscience.com"

/**
 * 서버에서 Omnis API 를 부를 때의 기준 주소. `content/server.ts`(기사 읽기)와
 * `app/api/contact`(문의 접수)가 같은 값을 쓴다 — 두 곳에 기본값을 적어 두면 한쪽만
 * 고치고 넘어가게 된다.
 *
 * 브라우저에서 쓰는 주소는 `lib/omnis-auth.ts` 의 `OMNIS_ORIGIN`(`NEXT_PUBLIC_`)이다.
 * 그쪽은 `"use client"` 파일이라 서버 라우트에서 임포트하지 않는다.
 */
export const OMNIS_API_BASE =
  process.env.OMNIS_API_BASE ?? "https://omnis.haddscience.com/api/website"

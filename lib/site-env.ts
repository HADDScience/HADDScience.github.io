/**
 * 배포 대상에 따라 갈리는 값. 예전에는 scripts/postbuild.mjs 가 정적 산출물에 심었다.
 * 서버 렌더로 바뀌면서 robots · sitemap · <meta robots> 가 이 값을 읽는다.
 */

/** 컨펌용 배포. 색인을 막는다. Vercel 프로젝트 환경변수 DEPLOY_TARGET=pages. */
export const IS_REVIEW_BUILD = process.env.DEPLOY_TARGET === "pages"

export const SITE_URL = process.env.SITE_URL ?? "https://haddscience.com"

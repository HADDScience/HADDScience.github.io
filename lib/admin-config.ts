import type { GhConfig } from "@/lib/github"

/**
 * 관리자 페이지가 커밋할 저장소.
 *
 * 실도메인(Synology)에 올릴 때도 커밋 대상은 GitHub 저장소 그대로다 — 콘텐츠의
 * 단일 출처가 git 이고, 배포는 그 결과물을 옮기는 일이기 때문이다.
 */
const SLUG = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "HADDScience/HADDScience.github.io"
const [OWNER, REPO] = SLUG.split("/")

export const REPO_OWNER = OWNER
export const REPO_NAME = REPO
export const REPO_BRANCH = process.env.NEXT_PUBLIC_GITHUB_BRANCH ?? "main"

export const NEWS_DIR = "content/data/news"
export const NEWS_MEDIA_DIR = "public/news"

/** `token` 은 Omnis SSO 세션 토큰이다. GitHub 토큰은 Omnis 서버에만 있다. */
export function ghConfig(token: string): GhConfig {
  return { owner: REPO_OWNER, repo: REPO_NAME, branch: REPO_BRANCH, token }
}

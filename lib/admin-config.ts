import { OMNIS_ORIGIN } from "@/lib/omnis-auth"

/**
 * 관리자 페이지가 부르는 Omnis API.
 *
 * 기사와 사진은 Omnis(Neon · NAS)에 있다. 이 사이트는 정적 번들이라 비밀을 들 수 없고,
 * 로그인도 Omnis SSO 이므로 저장소도 그쪽이 맡는 것이 자연스럽다. 예전의 "git 이 DB"
 * 방식(GitHub 커밋)은 사람마다 토큰이 필요해 걷어냈다.
 */
export const API_BASE = `${OMNIS_ORIGIN}/api/website`

/** 요청마다 붙는 세션. token 은 Omnis SSO 세션 토큰이다. */
export interface ApiConfig {
  token: string
}

export function apiConfig(token: string): ApiConfig {
  return { token }
}

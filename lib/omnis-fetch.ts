/**
 * Omnis 로 나가는 **서버 쪽** 요청. 타임아웃과 한 번의 재시도만 얹는다.
 *
 * Node 의 `fetch` 에는 기본 타임아웃이 없다. 소켓이 끊기지 않으면 요청이 영원히 매달린다.
 * 기사 목록은 빌드가 361쪽을 만드는 재료라 그 한 건이 빌드 전체를 붙들고, Vercel 의 45분
 * 한도까지 간다. 동시 빌드가 하나뿐인 플랜에서는 그동안 회사의 다른 배포도 함께 막힌다 —
 * 2026-09-22 에 다른 브랜치의 빌드 하나가 35분 물려 세 프로젝트의 프리뷰가 전부 섰다.
 *
 * 타임아웃만 두면 잠깐의 느려짐이 곧바로 실패가 된다(기사 없는 사이트, 문의 접수 거부).
 * 그래서 한 번 더 시도한다. 최악이 45분에서 약 20초로 바뀐다.
 *
 * **POST 를 재시도해도 문의가 둘로 쌓이지 않는다.** Omnis 가 5분 안의 같은 이메일·같은
 * 본문을 같은 것으로 보고 `200 duplicate` 를 준다 — 바로 이 경우를 위해 둔 장치다.
 * 계약: Omnis `mydocs/plans/2026-09-22-website-inquiry-to-crm.md`.
 */

/** 한 번의 시도에 허용하는 시간. 재시도까지 하면 최악이 이 값의 두 배다. */
const TIMEOUT_MS = 10_000

export async function omnisFetch(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = TIMEOUT_MS
): Promise<Response> {
  let lastError: unknown
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
    } catch (err) {
      lastError = err
      if (attempt === 1) {
        console.warn(
          `[omnis] ${url} 첫 시도 실패, 한 번 더 시도한다:`,
          err instanceof Error ? err.message : err
        )
      }
    }
  }
  throw lastError
}

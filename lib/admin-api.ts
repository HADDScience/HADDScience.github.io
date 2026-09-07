import { API_BASE, type ApiConfig } from "@/lib/admin-config"
import { appId } from "@/lib/omnis-auth"

/**
 * Omnis 의 홈페이지 API 를 부르는 얇은 클라이언트. 인증 헤더와 오류 메시지만 다룬다.
 * 경로·응답 형식은 Omnis 저장소 `app/api/website/**` 가 정한다.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

const MESSAGE: Record<string, string> = {
  invalid_session: "세션이 끝났습니다. 다시 로그인해 주세요.",
  account_inactive: "이 계정은 비활성 상태입니다.",
  origin_not_allowed: "이 주소는 인증 서버에 등록돼 있지 않습니다.",
  unknown_app: "이 주소는 인증 서버에 등록돼 있지 않습니다.",
  sso_disabled: "인증 서버에 SSO 설정이 없습니다.",
  invalid_post: "기사 내용에 잘못된 부분이 있습니다.",
  too_large: "사진이 너무 큽니다 (4MB 이내).",
  unsupported_type: "지원하지 않는 사진 형식입니다.",
  not_found: "기사를 찾지 못했습니다.",
}

export async function api<T>(
  cfg: ApiConfig,
  path: string,
  init?: RequestInit & { raw?: BodyInit }
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    body: init?.raw ?? init?.body,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "X-Sso-App": appId(),
      ...(init?.body && !init.raw ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  })
  if (!res.ok) {
    let code: string | undefined
    let detail = res.statusText
    try {
      const body = (await res.json()) as { error?: string; issues?: string[] }
      code = body.error
      detail = body.issues?.join(", ") ?? MESSAGE[code ?? ""] ?? code ?? detail
    } catch {
      /* 본문이 JSON 이 아니면 상태 텍스트를 그대로 쓴다 */
    }
    throw new ApiError(detail, res.status, code)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

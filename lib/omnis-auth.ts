"use client"

/**
 * Omnis 를 발급자로 삼는 관리자 로그인. Hub 의 `lib/omnis-auth.ts` 를 옮겨 왔다.
 *
 * 예전에는 사람마다 GitHub PAT 을 발급해 붙여 넣었다. 커밋 작성자가 실명으로 남는 것은
 * 좋았지만, 토큰 발급 절차가 비개발자에게 벅찼고 90일마다 갱신해야 했으며, 퇴사 처리가
 * GitHub 쪽 회수에 기대야 했다. 이제 계정의 주인은 Omnis 자체계정 하나다 — Hub ·
 * ip-platform 과 같은 구조이고, 정본은 Omnis 저장소의 `mydocs/tech/auth-architecture.md`.
 *
 * 흐름:
 *   1. startSignIn()  → https://haddscience.vercel.app/omnis/sso/authorize?app=website-admin-vercel&next=/admin/
 *   2. Omnis 가 로그인을 확인하고 /admin/#sso=<grant> 로 돌려보낸다 (60초·1회용)
 *   3. takeGrantFromHash() → redeemGrant() → 8시간짜리 세션 토큰 + 프로필
 *   4. 새로고침마다 verifyStoredSession() 으로 아직 유효한지 되묻는다
 *   5. GitHub 호출은 그 세션 토큰을 들고 Omnis 의 프록시(/api/website/github)로 간다.
 *      GitHub 토큰은 Omnis 서버에만 있다. 정적 사이트는 비밀을 들 수 없다.
 *
 * 토큰이 프래그먼트(#)로 오는 이유: 서버로 전송되지 않아 GitHub Pages 접근 로그에도
 * Referer 에도 남지 않는다. 받자마자 주소창에서도 지운다.
 *
 * 화면에는 "Omnis" 라는 이름이 나가지 않는다. 사용자에게는 「HADD 계정」이다.
 */

/**
 * 발급자 주소. 경로(/omnis)가 붙어 있다 — haddscience.vercel.app 이 /omnis/* 를 Omnis 로
 * rewrite 하므로, 한 도메인에서는 같은 오리진 호출이 되고 github.io 처럼 다른 오리진에서는
 * CORS 로 간다. `new URL("/path", OMNIS_ORIGIN)` 은 이 경로를 지우므로 문자열로 이어 붙인다.
 */
export const OMNIS_ORIGIN =
  process.env.NEXT_PUBLIC_OMNIS_URL ?? "https://haddscience.vercel.app/omnis"

/** next.config.ts 에 basePath 는 없고 관리 화면은 /admin 아래다. */
const BASE_PATH = "/admin"

/**
 * Omnis 화이트리스트의 앱 id. 토큰의 audience 이기도 하다.
 *
 * 같은 정적 번들이 github.io(컨펌용)와 haddscience.com(실서비스)에 그대로 올라가므로
 * 빌드 시점에 하나로 고정할 수 없다. 오리진을 보고 고른다. 등록되지 않은 오리진
 * (예: 미리보기 서버)에서는 개발용 id 로 떨어지고, Omnis 가 origin_not_allowed 로 거부한다.
 */
export function appId(): string {
  if (typeof window === "undefined") return "website-admin"
  switch (window.location.origin) {
    case "https://haddscience.vercel.app":
      return "website-admin-vercel"
    case "https://haddscience.github.io":
      return "website-admin"
    case "https://haddscience.com":
    case "https://www.haddscience.com":
      return "website-admin-com"
    default:
      return "website-admin-dev"
  }
}

const storageKey = () => `hadd.sso.session.${appId()}`

export interface OmnisUser {
  id: string
  name: string
  email: string | null
  /** Omnis 의 역할 — "ADMIN" | "MEMBER" */
  role: string
}

export interface OmnisSession {
  token: string
  /** epoch ms */
  expiresAt: number
  user: OmnisUser
}

// ─── 로그인 시작 ────────────────────────────────────────────────────

export function startSignIn(returnPath: string = `${BASE_PATH}/`): void {
  if (typeof window === "undefined") return
  const url = new URL(`${OMNIS_ORIGIN}/sso/authorize`)
  url.searchParams.set("app", appId())
  url.searchParams.set("next", returnPath)
  window.location.assign(url.toString())
}

/** Omnis 의 계정 설정 — 비밀번호·소셜 연결은 전부 저기서 관리한다. */
export function omnisSettingsUrl(): string {
  return `${OMNIS_ORIGIN}/settings`
}

// ─── 돌아온 토큰 집어내기 ────────────────────────────────────────────

/** 주소의 `#sso=` 를 꺼내면서 주소창에서 지운다. 세션을 확인하기 전에 부른다. */
export function takeGrantFromHash(): string | null {
  if (typeof window === "undefined") return null
  const hash = window.location.hash
  if (!hash.startsWith("#")) return null

  const params = new URLSearchParams(hash.slice(1))
  const grant = params.get("sso")
  if (!grant) return null

  params.delete("sso")
  const rest = params.toString()
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}${rest ? `#${rest}` : ""}`
  )
  return grant
}

// ─── Omnis 와 주고받기 ──────────────────────────────────────────────

export class OmnisAuthError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message)
    this.name = "OmnisAuthError"
  }
}

function messageFor(code: string): string {
  switch (code) {
    case "grant_already_used":
      return "이미 사용된 로그인 링크입니다. 다시 로그인해 주세요."
    case "invalid_grant":
      return "로그인 링크가 만료되었습니다. 다시 로그인해 주세요."
    case "account_inactive":
      return "이 계정은 비활성 상태입니다. 관리자에게 문의해 주세요."
    case "origin_not_allowed":
    case "unknown_app":
      return "이 주소는 인증 서버에 등록돼 있지 않습니다. 관리자에게 알려주세요."
    case "sso_disabled":
      return "인증 서버에 SSO 설정이 없습니다. 관리자에게 알려주세요."
    default:
      return "로그인을 마치지 못했습니다. 다시 시도해 주세요."
  }
}

async function post(path: string, token: string): Promise<Response> {
  return fetch(`${OMNIS_ORIGIN}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, app: appId() }),
  })
}

/** 1회용 표를 8시간짜리 세션으로 바꾼다. 실패하면 OmnisAuthError. */
export async function redeemGrant(grant: string): Promise<OmnisSession> {
  let res: Response
  try {
    res = await post("/api/sso/redeem", grant)
  } catch {
    throw new OmnisAuthError(
      "network",
      "인증 서버에 연결하지 못했습니다. 네트워크를 확인해 주세요."
    )
  }

  const body = (await res.json().catch(() => null)) as {
    token?: string
    expiresAt?: number
    user?: OmnisUser
    error?: string
  } | null

  if (!res.ok || !body?.token || !body.user || !body.expiresAt) {
    const code = body?.error ?? "unknown"
    throw new OmnisAuthError(code, messageFor(code))
  }

  return { token: body.token, expiresAt: body.expiresAt, user: body.user }
}

export type VerifyOutcome =
  /** 살아 있다. user 는 Omnis 가 방금 DB 에서 읽은 최신값이다. */
  | { kind: "ok"; user: OmnisUser }
  /** 서버가 분명히 거부했다 — 저장된 세션을 지워야 한다. */
  | { kind: "rejected" }
  /** 판단 불가(네트워크·서버 오류). 저장된 만료 시각을 믿고 버틴다. */
  | { kind: "unknown" }

export async function verifyStoredSession(token: string): Promise<VerifyOutcome> {
  let res: Response
  try {
    res = await post("/api/sso/verify", token)
  } catch {
    return { kind: "unknown" }
  }

  if (res.status === 401 || res.status === 403) return { kind: "rejected" }
  if (!res.ok) return { kind: "unknown" }

  const body = (await res.json().catch(() => null)) as { user?: OmnisUser } | null
  if (!body?.user) return { kind: "unknown" }
  return { kind: "ok", user: body.user }
}

// ─── 저장 ───────────────────────────────────────────────────────────

export function readStoredSession(): OmnisSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(storageKey())
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<OmnisSession>
    if (
      typeof parsed.token !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      !parsed.user?.id
    ) {
      return null
    }
    return parsed as OmnisSession
  } catch {
    return null
  }
}

export function storeSession(session: OmnisSession): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(session))
  } catch {
    // 저장하지 못해도 이번 방문은 그대로 쓸 수 있다. 새로고침하면 다시 로그인한다.
  }
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(storageKey())
  } catch {
    /* 지울 수 없으면 만료를 기다리는 수밖에 없다 */
  }
}

"use client"

import * as React from "react"

import { ghConfig } from "@/lib/admin-config"
import type { GhConfig } from "@/lib/github"
import {
  clearStoredSession,
  OmnisAuthError,
  readStoredSession,
  redeemGrant,
  startSignIn,
  storeSession,
  takeGrantFromHash,
  verifyStoredSession,
  type OmnisSession,
  type OmnisUser,
} from "@/lib/omnis-auth"

export type SessionState =
  | { status: "loading" }
  | { status: "anonymous"; error?: string }
  | { status: "ready"; cfg: GhConfig; user: OmnisUser }

/**
 * 관리자 세션. 계정의 주인은 Omnis 자체계정이다 — 흐름은 `lib/omnis-auth.ts` 참고.
 *
 * 페이지를 열면 세 갈래다:
 *   - 주소에 `#sso=` 가 있다 → 방금 Omnis 에서 돌아왔다. 표를 세션으로 바꾼다.
 *   - 저장된 세션이 있다 → 아직 유효한지 되묻는다. 거부되면 지운다.
 *   - 둘 다 없다 → 로그인 화면.
 */
export function useAdminSession() {
  const [state, setState] = React.useState<SessionState>({ status: "loading" })

  const ready = (session: OmnisSession, user: OmnisUser = session.user) =>
    setState({ status: "ready", cfg: ghConfig(session.token), user })

  const signIn = React.useCallback(() => {
    startSignIn()
  }, [])

  const signOut = React.useCallback(() => {
    clearStoredSession()
    setState({ status: "anonymous" })
  }, [])

  React.useEffect(() => {
    let cancelled = false
    // 효과 본문에서 곧바로 setState 하지 않는다(react-hooks/set-state-in-effect).
    void Promise.resolve().then(async () => {
      const grant = takeGrantFromHash()
      if (grant) {
        try {
          const session = await redeemGrant(grant)
          if (cancelled) return
          storeSession(session)
          ready(session)
        } catch (err) {
          if (cancelled) return
          setState({
            status: "anonymous",
            error:
              err instanceof OmnisAuthError
                ? err.message
                : "로그인을 마치지 못했습니다. 다시 시도해 주세요.",
          })
        }
        return
      }

      const saved = readStoredSession()
      if (!saved) {
        if (!cancelled) setState({ status: "anonymous" })
        return
      }
      if (saved.expiresAt <= Date.now()) {
        clearStoredSession()
        if (!cancelled) setState({ status: "anonymous" })
        return
      }

      const outcome = await verifyStoredSession(saved.token)
      if (cancelled) return
      if (outcome.kind === "rejected") {
        clearStoredSession()
        setState({
          status: "anonymous",
          error: "세션이 끝났습니다. 다시 로그인해 주세요.",
        })
        return
      }
      // 판단 불가(네트워크)면 저장된 만료 시각을 믿고 들여보낸다. 프록시가 어차피
      // 요청마다 다시 검사하므로 죽은 세션으로는 아무것도 저장할 수 없다.
      const user = outcome.kind === "ok" ? outcome.user : saved.user
      if (outcome.kind === "ok") storeSession({ ...saved, user })
      ready(saved, user)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { state, signIn, signOut }
}

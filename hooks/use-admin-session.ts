"use client"

import * as React from "react"

import { ghConfig } from "@/lib/admin-config"
import { verify, type GhConfig, type GhIdentity } from "@/lib/github"

const STORAGE_KEY = "hadd-admin-token"

export type SessionState =
  | { status: "loading" }
  | { status: "anonymous"; error?: string }
  | { status: "ready"; cfg: GhConfig; identity: GhIdentity }

/**
 * 관리자 세션.
 *
 * 토큰은 localStorage 에만 둔다. 이 사이트에는 서버가 없으므로 토큰이 우리 쪽
 * 어딘가에 저장될 일이 없고, 나가는 요청은 api.github.com 뿐이다.
 */
export function useAdminSession() {
  const [state, setState] = React.useState<SessionState>({ status: "loading" })

  const signIn = React.useCallback(async (token: string, remember: boolean) => {
    setState({ status: "loading" })
    const cfg = ghConfig(token.trim())
    try {
      const identity = await verify(cfg)
      if (!identity.canWrite) {
        setState({
          status: "anonymous",
          error:
            "이 토큰에는 저장소 쓰기 권한이 없습니다. Contents 권한을 Read and write 로 발급해 주세요.",
        })
        return
      }
      if (remember) localStorage.setItem(STORAGE_KEY, cfg.token)
      setState({ status: "ready", cfg, identity })
    } catch (err) {
      setState({
        status: "anonymous",
        error:
          err instanceof Error
            ? `로그인하지 못했습니다 — ${err.message}`
            : "로그인하지 못했습니다",
      })
    }
  }, [])

  const signOut = React.useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState({ status: "anonymous" })
  }, [])

  // 저장된 토큰이 있으면 조용히 복원한다. 만료·회수된 토큰이면 로그인 화면으로 떨어진다.
  React.useEffect(() => {
    let cancelled = false
    // 효과 본문에서 곧바로 setState 하지 않는다(react-hooks/set-state-in-effect).
    // 토큰 복원은 어차피 네트워크 확인이 끝나야 결론이 나므로 마이크로태스크로 미룬다.
    void Promise.resolve()
      .then(async () => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (!saved) {
          if (!cancelled) setState({ status: "anonymous" })
          return
        }
        const cfg = ghConfig(saved)
        try {
          const identity = await verify(cfg)
          if (cancelled) return
          if (!identity.canWrite) {
            localStorage.removeItem(STORAGE_KEY)
            setState({ status: "anonymous", error: "토큰에 쓰기 권한이 없습니다." })
            return
          }
          setState({ status: "ready", cfg, identity })
        } catch {
          if (cancelled) return
          localStorage.removeItem(STORAGE_KEY)
          setState({
            status: "anonymous",
            error: "저장된 토큰이 더 이상 유효하지 않습니다. 다시 발급해 주세요.",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { state, signIn, signOut }
}

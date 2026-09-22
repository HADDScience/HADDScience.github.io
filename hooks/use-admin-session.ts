"use client"

import * as React from "react"

import { apiConfig, type ApiConfig } from "@/lib/admin-config"
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
  | { status: "ready"; cfg: ApiConfig; user: OmnisUser }

/**
 * 이 탭에서 자동 로그인을 이미 한 번 시도했는가.
 *
 * 관리 화면의 세션(localStorage)과 Omnis 의 로그인(omnis.haddscience.com 쿠키)은 서로 다른
 * 오리진에 있어, 여기서는 저쪽이 살아 있는지 **읽을 수가 없다**. 확인하는 유일한 방법이
 * `/sso/authorize` 로 한 번 다녀오는 것이라 그냥 다녀온다. 대부분은 옴니스에 이미 로그인돼
 * 있어 눈에 띄지 않게 돌아온다.
 *
 * 탭당 한 번으로 묶는 이유는 되돌아왔는데도 세션이 없는 경우(표를 못 바꿨다든가) 무한히
 * 왕복하지 않기 위해서다. sessionStorage 라 새 탭에서는 다시 한 번 시도한다.
 */
const AUTO_KEY = "hadd.sso.auto-signin"

function claimAutoSignIn(): boolean {
  try {
    if (window.sessionStorage.getItem(AUTO_KEY)) return false
    window.sessionStorage.setItem(AUTO_KEY, "1")
    return true
  } catch {
    // 저장할 수 없으면 왕복을 멈출 방법이 없다. 자동 로그인을 포기하고 버튼을 보여준다.
    return false
  }
}

function releaseAutoSignIn(): void {
  try {
    window.sessionStorage.removeItem(AUTO_KEY)
  } catch {
    /* 못 지워도 이번 탭에서 한 번 더 자동 로그인하지 않을 뿐이다 */
  }
}

/**
 * 관리자 세션. 계정의 주인은 Omnis 자체계정이다 — 흐름은 `lib/omnis-auth.ts` 참고.
 *
 * 페이지를 열면 세 갈래다:
 *   - 주소에 `#sso=` 가 있다 → 방금 Omnis 에서 돌아왔다. 표를 세션으로 바꾼다.
 *   - 저장된 세션이 있다 → 아직 유효한지 되묻는다. 거부되면 지운다.
 *   - 둘 다 없다 → Omnis 에 한 번 물어보러 간다(탭당 한 번). 거기서도 아니면 로그인 화면.
 */
export function useAdminSession() {
  const [state, setState] = React.useState<SessionState>({ status: "loading" })

  const ready = (session: OmnisSession, user: OmnisUser = session.user) =>
    setState({ status: "ready", cfg: apiConfig(session.token), user })

  const signIn = React.useCallback(() => {
    startSignIn()
  }, [])

  const signOut = React.useCallback(() => {
    clearStoredSession()
    // 로그아웃한 사람을 곧바로 다시 들여보내면 로그아웃이 되지 않는다.
    // 표식을 남겨 이 탭에서는 자동 로그인이 돌지 않게 한다.
    try {
      window.sessionStorage.setItem(AUTO_KEY, "1")
    } catch {
      /* 못 남겨도 이 화면은 그대로 로그인 버튼을 보여준다 */
    }
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
          // 한 번 들어왔으니 표식을 푼다. 이 탭을 오래 열어 두어 8시간이 지나도
          // 다음 새로고침에서 다시 조용히 돌아올 수 있다.
          releaseAutoSignIn()
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

      /**
       * 세션이 없을 때. Omnis 에 한 번 물어보러 갔다 온다 — 거기 로그인돼 있으면
       * 사람이 아무것도 누르지 않고 돌아오고, 아니면 Omnis 로그인 화면에서 멈춘다.
       * 이미 한 번 다녀온 탭이면 그냥 로그인 버튼을 보여준다.
       */
      const noSession = (error?: string) => {
        if (cancelled) return
        if (claimAutoSignIn()) {
          // 화면은 loading 인 채로 둔다. 로그인 버튼을 깜빡 보여주고 넘기면 더 어수선하다.
          startSignIn()
          return
        }
        setState({ status: "anonymous", error })
      }

      const saved = readStoredSession()
      if (!saved) {
        noSession()
        return
      }
      if (saved.expiresAt <= Date.now()) {
        clearStoredSession()
        noSession()
        return
      }

      const outcome = await verifyStoredSession(saved.token)
      if (cancelled) return
      if (outcome.kind === "rejected") {
        clearStoredSession()
        noSession("세션이 끝났습니다. 다시 로그인해 주세요.")
        return
      }
      // 판단 불가(네트워크)면 저장된 만료 시각을 믿고 들여보낸다. API 가 어차피
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

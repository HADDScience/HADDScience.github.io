"use client"

import { usePathname } from "next/navigation"
import * as React from "react"

/**
 * 방문 한 건을 `/api/hit` 에 알린다. 공개 레이아웃에만 있고 관리 화면에는 없다.
 *
 * 서버(미들웨어)에서 세지 않는 이유는 봇 때문이다. 자바스크립트가 돌아야 오므로
 * 크롤러 대부분이 애초에 오지 않고, 페이지 응답이 통계 때문에 느려지지도 않는다.
 * 대신 자바스크립트를 끈 방문은 세지 못한다 — 부풀린 숫자보다 낫다.
 *
 * `sendBeacon` 은 페이지를 떠나도 전송이 살아남고 응답을 기다리지 않는다.
 */
export function VisitBeacon() {
  const pathname = usePathname()
  // 같은 경로를 두 번 보내지 않는다. 개발 모드의 StrictMode 이중 실행도 여기서 걸린다.
  const sent = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!pathname || sent.current === pathname) return
    sent.current = pathname

    const body = JSON.stringify({ path: pathname, referrer: document.referrer })
    try {
      // 같은 출처라 application/json 이어도 프리플라이트가 없다.
      const blob = new Blob([body], { type: "application/json" })
      if (!navigator.sendBeacon?.("/api/hit", blob)) {
        void fetch("/api/hit", { method: "POST", body, keepalive: true })
      }
    } catch {
      /* 통계가 화면을 방해하지 않는다 */
    }
  }, [pathname])

  return null
}

"use client"

import * as React from "react"

import { Badge } from "@/components/ds/primitives"
import { useNow } from "@/hooks/use-now"
import { isClosed, remaining, type RecruitPeriod } from "@/lib/career-deadline"

/**
 * 모집 상태에 따라 바뀌는 조각들. 페이지는 정적으로 구워지므로(ISR) 마감 판단을 빌드 시각에 맡기면
 * 재배포 전까지 「모집 중」이 남는다. 그래서 여기서 브라우저 시계로 다시 판단한다.
 *
 * `serverNow` 는 서버가 페이지를 그린 시각이다. 하이드레이션 때는 이 값으로 그려 서버 HTML 과 같게
 * 맞추고(경고 없음), 직후 브라우저 시계로 바꾼다(`hooks/use-now.ts`). 서버가 그린 뒤 마감이 지난
 * 캐시를 받은 경우에만 첫 프레임이 「모집 중」이고 곧바로 「마감」으로 바뀐다 — 캐시 수명은 공고 페이지의
 * `revalidate`(5분)로 짧게 잡았다.
 */

function useOpen(job: RecruitPeriod, serverNow: number): boolean {
  const now = useNow(serverNow) ?? serverNow
  return !isClosed(job, now)
}

export function JobStatusBadge({
  job,
  serverNow,
  openLabel,
  closedLabel,
  slug,
  invitedLabel,
}: {
  job: RecruitPeriod
  serverNow: number
  openLabel: string
  closedLabel: string
  /** 주면 마감 뒤라도 유효한 개인 초대(?invite=)일 때 invitedLabel 을 보인다 */
  slug?: string
  invitedLabel?: string
}) {
  const open = useOpen(job, serverNow)
  const invited = useValidInvite(slug ?? "") && !!slug && !!invitedLabel
  if (!open && invited) return <Badge tone="success">{invitedLabel}</Badge>
  return <Badge tone={open ? "success" : "neutral"}>{open ? openLabel : closedLabel}</Badge>
}

/**
 * 안쪽 컴포넌트가 「지금 내리지 말라」고 붙잡는 함수. 지원서 폼이 제출을 시작하면 부른다 — 16:59 에 낸
 * 지원서가 파일을 올리는 동안 17:00 이 되어 폼이 통째로 사라지면 업로드가 끊기고 접수 번호도 못 본다.
 * 마감 판단은 API ① 이 이미 했다(서버 시계).
 */
const HoldOpenContext = React.createContext<(hold: boolean) => void>(() => {})
export const useHoldOpen = () => React.useContext(HoldOpenContext)

/** 모집 중일 때만 `children`, 마감 뒤에는 `fallback`. 안에서 `useHoldOpen()(true)` 로 붙잡으면 마감 뒤에도 남는다. */
export function WhenOpen({
  job,
  serverNow,
  children,
  fallback,
}: {
  job: RecruitPeriod
  serverNow: number
  children: React.ReactNode
  fallback: React.ReactNode
}) {
  const open = useOpen(job, serverNow)
  const [held, setHeld] = React.useState(false)
  return (
    <HoldOpenContext.Provider value={setHeld}>{open || held ? children : fallback}</HoldOpenContext.Provider>
  )
}

/**
 * 마감까지 남은 시간. 1초마다 줄어든다.
 *
 * 서버와 첫 렌더에서는 숫자 자리에 「–」를 둔다(`useNow(null)`). 서버 시각으로 숫자를 그리면 캐시된
 * 페이지에서 몇 분 전 숫자가 보였다가 바뀐다. 자리 폭은 고정이라 숫자가 들어와도 줄이 움직이지 않는다.
 */
export function DeadlineCountdown({
  job,
  label,
  units,
}: {
  job: RecruitPeriod
  label: string
  units: { days: string; hours: string; minutes: string; seconds: string }
}) {
  const now = useNow(null)
  // 마감 뒤 안내는 바로 아래 지원 버튼 자리(`WhenOpen` 의 fallback)가 맡는다. 여기서도 쓰면 두 번 나온다.
  if (now !== null && isClosed(job, now)) return null
  const left = now === null ? null : remaining(job, now)
  const parts = [
    [left?.days, units.days],
    [left?.hours, units.hours],
    [left?.minutes, units.minutes],
    [left?.seconds, units.seconds],
  ] as const

  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm" aria-live="off">
      <span className="font-semibold text-muted-foreground">{label}</span>
      {parts.map(([value, unit]) => (
        <span key={unit} className="inline-flex items-baseline">
          <span className="inline-block min-w-[2ch] text-right text-lg font-bold text-primary tabular-nums">
            {value === undefined ? "–" : unit === units.days ? value : String(value).padStart(2, "0")}
          </span>
          <span className="ml-0.5 font-semibold">{unit}</span>
        </span>
      ))}
    </p>
  )
}

/** 마감 뒤 개인 초대(lib/career-invite.ts)로 열린 토큰. 없으면 null — 폼이 이것을 보고 마감 검사를 건너뛰고 지원서에 싣는다 */
const InviteContext = React.createContext<string | null>(null)
export const useInviteToken = () => React.useContext(InviteContext)

/**
 * 주소의 `?invite=` 토큰이 이 공고에 지금 유효한지 서버에 묻는다(비밀은 서버에만). 유효하면 토큰, 아니면 null.
 * 페이지는 정적으로 다시 만들어지므로(ISR) 주소를 화면에서 읽는다.
 */
// 한 페이지의 배지 · 버튼 · 폼이 같은 확인 한 번을 나눠 쓴다
const inviteChecks = new Map<string, Promise<string | null>>()
function checkInvite(slug: string): Promise<string | null> {
  const given = new URLSearchParams(window.location.search).get("invite")
  if (!given) return Promise.resolve(null)
  const key = `${slug}|${given}`
  let p = inviteChecks.get(key)
  if (!p) {
    p = fetch(`/api/career/invite?slug=${encodeURIComponent(slug)}&invite=${encodeURIComponent(given)}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ valid?: boolean }>) : { valid: false }))
      .then((r) => (r.valid ? given : null))
      .catch(() => null)
    inviteChecks.set(key, p)
  }
  return p
}

export function useValidInvite(slug: string): string | null {
  const [token, setToken] = React.useState<string | null>(null)
  React.useEffect(() => {
    let alive = true
    void checkInvite(slug).then((t) => { if (alive) setToken(t) })
    return () => { alive = false }
  }, [slug])
  return token
}

/** `WhenOpen` 과 같되, 마감 뒤라도 유효한 개인 초대 토큰이 있으면 `children` 을 보인다 */
export function WhenOpenOrInvited({
  job,
  slug,
  serverNow,
  children,
  fallback,
}: {
  job: RecruitPeriod
  slug: string
  serverNow: number
  children: React.ReactNode
  fallback: React.ReactNode
}) {
  const invite = useValidInvite(slug)
  // 폼은 확인이 끝난 뒤에 생긴다 — 주소의 #apply 로 가는 스크롤은 그 전에 끝나 위에 머문다. 생긴 뒤 다시 간다
  React.useEffect(() => {
    if (!invite || window.location.hash !== "#apply") return
    const id = requestAnimationFrame(() => document.getElementById("apply")?.scrollIntoView({ block: "start" }))
    return () => cancelAnimationFrame(id)
  }, [invite])
  if (invite) return <InviteContext.Provider value={invite}>{children}</InviteContext.Provider>
  return (
    <WhenOpen job={job} serverNow={serverNow} fallback={fallback}>
      {children}
    </WhenOpen>
  )
}

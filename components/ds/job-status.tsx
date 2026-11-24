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
}: {
  job: RecruitPeriod
  serverNow: number
  openLabel: string
  closedLabel: string
}) {
  const open = useOpen(job, serverNow)
  return <Badge tone={open ? "success" : "neutral"}>{open ? openLabel : closedLabel}</Badge>
}

/** 모집 중일 때만 `children`, 마감 뒤에는 `fallback`. */
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
  return useOpen(job, serverNow) ? children : fallback
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

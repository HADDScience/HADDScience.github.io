"use client"

import { cn } from "@/lib/utils"

/**
 * 관리 화면의 작은 막대 그래프. 콘텐츠 현황(월별 발행)과 사이트 통계(일별 방문자)가 같이 쓴다.
 *
 * 한 갈래뿐이라 범례가 없고 색도 하나다 — 색을 나누면 없는 구분이 있는 것처럼 보인다.
 * 값은 막대마다 적지 않고 hover 로 읽는다. 열두 개든 아흔 개든 숫자를 다 적으면 읽히지 않는다.
 * 값이 0 인 칸도 2px 눈금으로 자리를 지킨다 — 빼면 뜸했던 기간이 붙어 추이가 거짓이 된다.
 */

export interface Bar {
  /** React key. 날짜·월 같은 고유값 */
  key: string
  /** 막대 아래 눈금. 빈 문자열이면 눈금을 적지 않는다 */
  label: string
  value: number
  /** hover 로 읽는 한 줄 */
  tooltip: string
  /** 화면낭독기가 읽는 한 줄 */
  sr: string
}

export function MiniBars({
  bars,
  className,
  barClassName,
}: {
  bars: Bar[]
  className?: string
  /** 막대 최대 폭. 칸을 꽉 채우면 기둥이 아니라 벽으로 보인다 */
  barClassName?: string
}) {
  const peak = Math.max(1, ...bars.map((b) => b.value))
  return (
    <>
      <ul className={cn("flex h-20 items-end gap-0.5", className)}>
        {bars.map((b) => (
          <li
            key={b.key}
            className="group/bar relative flex h-full flex-1 items-end"
          >
            <span className="sr-only">{b.sr}</span>
            <span
              aria-hidden
              className={cn(
                "mx-auto w-full rounded-t-[4px]",
                barClassName ?? "max-w-9",
                b.value ? "bg-brand-blue-700" : "bg-border"
              )}
              style={{ height: b.value ? `${(b.value / peak) * 100}%` : "2px" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-[8px] bg-foreground px-2 py-1 text-[10px] whitespace-nowrap text-background tabular-nums opacity-0 transition-opacity duration-120 ease-[var(--ease-standard)] group-hover/bar:opacity-100"
            >
              {b.tooltip}
            </span>
          </li>
        ))}
      </ul>
      <ul aria-hidden className="mt-1 flex gap-0.5">
        {bars.map((b) => (
          <li
            key={b.key}
            className="flex-1 text-center text-[10px] text-muted-foreground tabular-nums"
          >
            {b.label}
          </li>
        ))}
      </ul>
    </>
  )
}

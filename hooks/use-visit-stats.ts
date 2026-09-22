"use client"

import * as React from "react"

import { ApiError } from "@/lib/admin-api"
import type { ApiConfig } from "@/lib/admin-config"
import { loadStats, type StatsDays, type VisitStats } from "@/lib/admin-stats"

/**
 * 방문 통계 한 벌. 통계 패널과 글 목록이 **같은 것**을 본다.
 *
 * 패널 안에서 따로 받아 오면 목록의 글별 숫자와 기간이 어긋난다 — 패널은 7일인데
 * 목록은 30일치를 보여 주는 식이다. 기간을 바꾸면 둘이 같이 움직여야 한다.
 */
export function useVisitStats(cfg: ApiConfig) {
  const [days, setDays] = React.useState<StatsDays>(30)
  const [data, setData] = React.useState<VisitStats | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(
    async (d: StatsDays) => {
      setBusy(true)
      try {
        setData(await loadStats(cfg, d))
        setError(null)
      } catch (err) {
        // 아직 배포되지 않은 상태와 진짜 오류를 구분해 준다 — 둘의 대처가 다르다.
        setError(
          err instanceof ApiError && err.status === 404
            ? "통계를 받을 준비가 아직 안 됐습니다 (Omnis 에 배포되면 보입니다)."
            : err instanceof Error
              ? err.message
              : "통계를 불러오지 못했습니다"
        )
      } finally {
        setBusy(false)
      }
    },
    [cfg]
  )

  React.useEffect(() => {
    void Promise.resolve().then(() => load(days))
  }, [load, days])

  /** 글 id → 그 기간의 조회·방문자. 방문이 없는 글은 여기 없다. */
  const byPost = React.useMemo(
    () => new Map((data?.posts ?? []).map((p) => [p.id, p] as const)),
    [data]
  )

  return {
    days,
    setDays,
    data,
    byPost,
    error,
    busy,
    reload: () => void load(days),
  }
}

export type VisitStatsState = ReturnType<typeof useVisitStats>

import { api } from "@/lib/admin-api"
import type { ApiConfig } from "@/lib/admin-config"

/**
 * 방문 통계를 읽는다. 표와 집계는 Omnis 가 맡는다 — 이 파일은 모양만 안다.
 * 계약의 정본은 Omnis 의 `mydocs/plans/2026-09-22-website-visit-stats.md`.
 */

export const STATS_DAYS = [7, 30, 90] as const
export type StatsDays = (typeof STATS_DAYS)[number]

export interface VisitStats {
  days: number
  /** KST `YYYY-MM-DD` */
  from: string
  to: string
  /** visitors 는 날짜별 합이 아니라 기간 안의 서로 다른 방문자 수다 */
  totals: { views: number; visitors: number }
  today: { views: number; visitors: number }
  daily: { date: string; views: number; visitors: number }[]
  topPaths: { path: string; views: number; visitors: number }[]
  referrers: { host: string; views: number }[]
  devices: { device: string; views: number }[]
}

export function loadStats(
  cfg: ApiConfig,
  days: StatsDays
): Promise<VisitStats> {
  return api<VisitStats>(cfg, `/stats?days=${days}`)
}

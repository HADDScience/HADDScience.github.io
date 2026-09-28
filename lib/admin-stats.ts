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
  /** 글별. 한국어판·영문판을 한 글로 합쳐 센다. 방문이 없는 글은 없다 */
  posts: { id: string; views: number; visitors: number }[]
  referrers: { host: string; views: number }[]
  devices: { device: string; views: number }[]
  /**
   * 아직 집계 표로 옮겨지지 않은 방문 수 — 위 숫자에 **들어 있지 않다**(2026-09-28 부터).
   *
   * Omnis 가 방문을 받는 즉시 Postgres 에 쓰지 않고 Redis 에 모았다가 매일 새벽 4시(KST)에
   * 한 번에 옮긴다. 방문 한 건마다 Neon 을 깨우면 깨어 있던 시간만큼 요금이 나오기 때문이다.
   * 그래서 옮기기 전까지 `today` 가 0 으로 보일 수 있다. 옛 Omnis 는 이 칸을 보내지 않는다.
   */
  pending?: number
  /**
   * 방문 버퍼(Redis)가 살아 있는가(2026-09-28 부터). `false` 면 **고장** — Omnis 가 방문을
   * Postgres 에 바로 쓰는 옛 방식으로 돌아가 있다. 숫자는 맞지만 방문마다 Neon 을 깨운다.
   *
   * 이 칸이 생긴 이유: 토큰 재발급 뒤 재배포가 빠져 버퍼가 죽었는데, 방문도 통계도 멀쩡해
   * 보여서 아무도 몰랐다. 실패를 삼키고 0 을 돌려주던 탓에 "0건"과 "못 셌다"가 같았다.
   * `true` 는 정상(또는 자격이 아예 없는 개발 환경). 옛 Omnis 는 이 칸을 보내지 않는다.
   */
  bufferOk?: boolean
}

export function loadStats(
  cfg: ApiConfig,
  days: StatsDays
): Promise<VisitStats> {
  return api<VisitStats>(cfg, `/stats?days=${days}`)
}

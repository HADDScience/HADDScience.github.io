/**
 * 공고의 모집 기간 판단. 화면(목록 · 상세 · 폼)과 API 가 같은 함수를 쓴다.
 *
 * 마감은 시각으로 판단한다 — 재배포 없이 17:00 이 지나면 닫혀야 하기 때문이다. 화면은 브라우저 시계로,
 * API 는 서버 시계로 판단하므로 브라우저 시계가 틀려도 마감 뒤 접수는 API 에서 막힌다.
 *
 * 클라이언트에서도 임포트하므로 서버 전용 모듈을 끌어오지 않는다.
 */

/** 모집 기간을 가진 공고. `JobPosting` 의 일부다. */
export interface RecruitPeriod {
  /** ISO 8601, 시간대까지 적는다. `2026-11-27T17:00:00+09:00` */
  closesAt: string
}

export function closesAtMs(job: RecruitPeriod): number {
  return Date.parse(job.closesAt)
}

export function isClosed(job: RecruitPeriod, now: number): boolean {
  return now >= closesAtMs(job)
}

/**
 * 지금 마감됐는가. 이벤트 처리기(제출 순간)에서 쓴다. 렌더 중에는 쓰지 않는다 — 렌더에서는
 * `hooks/use-now.ts` 의 시각을 받아 `isClosed` 를 부른다.
 */
export function isClosedNow(job: RecruitPeriod): boolean {
  return isClosed(job, Date.now())
}

/**
 * 서버 컴포넌트가 페이지를 그린 시각. 요청(또는 ISR 재생성)마다 한 번 불린다. 클라이언트로 넘겨
 * 하이드레이션 때 서버와 같은 상태를 그리는 데 쓴다(`components/ds/job-status.tsx`).
 */
export function renderedAt(): number {
  return Date.now()
}

/** 남은 시간을 일 · 시 · 분 · 초로 나눈다. 지났으면 null. */
export function remaining(job: RecruitPeriod, now: number) {
  const ms = closesAtMs(job) - now
  if (ms <= 0) return null
  const total = Math.floor(ms / 1000)
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  }
}

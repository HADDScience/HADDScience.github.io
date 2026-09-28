import type { Metadata } from "next"

import { StatsScreen } from "@/components/admin/stats-screen"

/**
 * 관리 화면의 첫 화면. 들어오면 지금 어떤지(방문·재고)부터 보인다.
 *
 * 화면 자체는 클라이언트 컴포넌트다. 페이지를 서버 컴포넌트로 얇게 두는 것은 오직
 * 제목 때문이다 — "use client" 를 단 페이지는 metadata 를 내보낼 수 없어서, 그대로 두면
 * 탭 제목이 레이아웃 기본값("콘텐츠 관리")으로 굳는다.
 */
// 제목을 통째로 적는다. title.template 은 **자식 세그먼트**에만 걸리고, 이 페이지는
// 틀을 정한 layout 과 같은 세그먼트라 "%s | HADD SCIENCE" 가 적용되지 않는다.
export const metadata: Metadata = { title: "사이트 통계 | HADD SCIENCE" }

export default function AdminHomePage() {
  return <StatsScreen />
}

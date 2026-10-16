import type { Metadata } from "next"

import { ColumnScreen } from "@/components/admin/column-screen"

/** 칼럼 키워드 → AI 초안 → 검토 → 라이브러리 게시. 제목만 붙이는 얇은 서버 컴포넌트다. */
export const metadata: Metadata = { title: "칼럼" }

export default function AdminColumnPage() {
  return <ColumnScreen />
}

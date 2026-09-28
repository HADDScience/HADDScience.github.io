import type { Metadata } from "next"

import { ContentScreen } from "@/components/admin/content-screen"

/** 글을 쓰고 고치는 화면. 제목만 붙이는 얇은 서버 컴포넌트다(까닭은 `app/admin/page.tsx`). */
export const metadata: Metadata = { title: "콘텐츠 관리" }

export default function AdminContentPage() {
  return <ContentScreen />
}

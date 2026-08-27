import type { Metadata } from "next"

import "../globals.css"
import { fontMono, pretendard } from "../fonts"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

/**
 * 관리자 페이지의 루트 레이아웃.
 *
 * 사이트 레이아웃(`app/[lang]/layout.tsx`)과 분리한다 — 헤더·푸터·언어 라우팅이
 * 필요 없고, `<html lang>` 도 관리 화면 언어(한국어)로 고정이다.
 */
export const metadata: Metadata = {
  title: "콘텐츠 관리 | HADD SCIENCE",
  // 공개 사이트에 함께 올라가므로 색인만은 확실히 막는다. 접근 통제는 GitHub 토큰이 한다.
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ko"
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        pretendard.variable
      )}
    >
      <body className="bg-muted/40">
        {children}
        {/* 사이트와 마찬가지로 라이트 테마 고정 — 디자인시스템에 다크 사양이 없다. */}
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  )
}

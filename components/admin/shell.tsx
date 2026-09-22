"use client"

import { ExternalLink, Loader2, LogOut } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { SignIn } from "@/components/admin/sign-in"
import { Button } from "@/components/ui/button"
import { useAdminSession } from "@/hooks/use-admin-session"
import type { ApiConfig } from "@/lib/admin-config"
import { OMNIS_ORIGIN } from "@/lib/omnis-auth"
import { cn } from "@/lib/utils"

/**
 * 관리 화면의 공통 틀 — 로그인 관문 + 머리 + 화면 전환.
 *
 * 화면이 둘이다: **콘텐츠**(`/admin`)는 글을 쓰고 고치는 곳, **통계**(`/admin/stats`)는
 * 숫자를 보는 곳. 한 화면에 다 있으면 글 하나 고치러 들어와도 통계부터 읽어야 한다.
 *
 * 로그인 상태 셋(`loading` · `anonymous` · `ready`)을 여기서 한 번만 다룬다. 페이지마다
 * 되풀이하면 한쪽만 고치는 일이 생긴다.
 */

const TABS = [
  { href: "/admin", label: "콘텐츠" },
  { href: "/admin/stats", label: "통계" },
] as const

export function AdminShell({
  current,
  title,
  children,
}: {
  current: "/admin" | "/admin/stats"
  title: string
  /** 로그인이 끝난 뒤에만 부른다 — 세션 토큰이 있어야 그릴 수 있는 화면이다. */
  children: (cfg: ApiConfig) => React.ReactNode
}) {
  const { state, signIn, signOut } = useAdminSession()

  if (state.status === "loading") {
    return (
      <div className="grid min-h-svh place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (state.status === "anonymous") {
    return <SignIn onSubmit={signIn} error={state.error} />
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24">
      <header className="flex flex-wrap items-center gap-3 py-8">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            HADD SCIENCE
          </p>
          <h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
        </div>
        <a
          href={`${OMNIS_ORIGIN}/settings`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          계정 설정 <ExternalLink className="size-3" />
        </a>
        <span className="text-sm text-muted-foreground">{state.user.name}</span>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="size-4" />
          나가기
        </Button>
      </header>

      <nav className="mb-6 flex w-fit items-center gap-1 rounded-full border border-border p-1">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={current === t.href ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-120 ease-[var(--ease-standard)]",
              current === t.href
                ? "bg-brand-blue-700 text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {children(state.cfg)}
    </main>
  )
}

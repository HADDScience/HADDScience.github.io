"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import { ContentStats, type IssueKey } from "@/components/admin/content-stats"
import { AdminShell } from "@/components/admin/shell"
import { SiteStats } from "@/components/admin/site-stats"
import type { Post } from "@/content/types"
import { useVisitStats } from "@/hooks/use-visit-stats"
import type { ApiConfig } from "@/lib/admin-config"
import { loadPosts, type PostIndex } from "@/lib/admin-posts"
import { cn } from "@/lib/utils"

/**
 * 통계 화면 — 숫자만 보는 곳.
 *
 * 사람들이 얼마나 들어왔는가(사이트 방문)와 우리가 무엇을 갖고 있는가(콘텐츠 현황)를
 * 나란히 둔다. 둘 다 "지금 어떤가"에 답하는 화면이라 같이 보는 편이 낫다.
 *
 * "손볼 것" 을 누르면 여기서 거르지 않고 **콘텐츠 화면으로 주소를 달고 넘어간다**
 * (`/admin?issue=no-body&tab=news`). 고칠 글은 고치는 화면에서 열어야 하고, 주소에
 * 남으니 그 목록을 북마크하거나 남에게 보낼 수도 있다.
 */
export default function AdminStatsPage() {
  return (
    <AdminShell current="/admin/stats" title="사이트 통계">
      {(cfg) => <Workspace cfg={cfg} />}
    </AdminShell>
  )
}

function Workspace({ cfg }: { cfg: ApiConfig }) {
  const router = useRouter()
  const [index, setIndex] = React.useState<PostIndex | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [tab, setTab] = React.useState<Post["category"]>("news")
  const stats = useVisitStats(cfg)

  React.useEffect(() => {
    // 효과 본문에서 곧바로 setState 하지 않기 위해 한 틱 미룬다.
    void Promise.resolve().then(async () => {
      try {
        setIndex(await loadPosts(cfg))
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "기사를 불러오지 못했습니다"
        )
      }
    })
  }, [cfg])

  const posts = index?.posts ?? []
  const inTab = posts.filter((p) => p.category === tab)
  const count = (c: Post["category"]) =>
    posts.filter((p) => p.category === c).length

  /** 고칠 글은 고치는 화면에서 연다. 여기서 거르면 목록이 없어 아무것도 못 한다. */
  const openIssue = (key: IssueKey | null) => {
    if (key) router.push(`/admin?issue=${key}&tab=${tab}`)
  }

  return (
    <>
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-destructive/8 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {index ? <SiteStats stats={stats} posts={posts} /> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: "news", label: "뉴스" },
            { id: "library", label: "하드:라이브러리" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold transition-colors duration-120 ease-[var(--ease-standard)]",
              tab === t.id
                ? "border-brand-blue-700 bg-brand-blue-700 text-white"
                : "border-border bg-card hover:border-brand-blue-500"
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold",
                tab === t.id ? "bg-white/20" : "bg-muted"
              )}
            >
              {count(t.id)}
            </span>
          </button>
        ))}
      </div>

      {index ? (
        <ContentStats
          posts={inTab}
          total={posts.length}
          label={tab === "library" ? "하드:라이브러리" : "뉴스"}
          issue={null}
          onIssue={openIssue}
        />
      ) : (
        <div className="grid place-items-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </>
  )
}

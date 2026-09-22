"use client"

import {
  ExternalLink,
  FileText,
  ImageOff,
  LayoutGrid,
  Loader2,
  LogOut,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import {
  ContentStats,
  matchesIssue,
  type IssueKey,
} from "@/components/admin/content-stats"
import { DeckEditor } from "@/components/admin/deck-editor"
import { PostEditor } from "@/components/admin/post-editor"
import { SignIn } from "@/components/admin/sign-in"
import { SiteStats } from "@/components/admin/site-stats"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAdminSession } from "@/hooks/use-admin-session"
import type { Post } from "@/content/types"
import {
  deletePost,
  formatDate,
  loadPosts,
  newPost,
  newPostId,
  setPinned,
  type PostIndex,
} from "@/lib/admin-posts"
import type { ApiConfig } from "@/lib/admin-config"
import { OMNIS_ORIGIN } from "@/lib/omnis-auth"
import { cn } from "@/lib/utils"

/**
 * 콘텐츠 관리 화면.
 *
 * 정적 화면이다. 로그인은 Omnis 자체계정(SSO), 기사와 사진은 Omnis 의 API 로 읽고 쓴다.
 * 저장하면 Omnis 가 사이트 캐시를 비워 곧바로 반영된다.
 */
export default function AdminPage() {
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

  return <Workspace cfg={state.cfg} who={state.user.name} onSignOut={signOut} />
}

/* ------------------------------------------------------------ 작업 화면 */

type View =
  | { mode: "list" }
  | { mode: "edit"; kind: "post" | "deck"; post: Post; isNew: boolean }

function Workspace({
  cfg,
  who,
  onSignOut,
}: {
  cfg: ApiConfig
  who: string
  onSignOut: () => void
}) {
  const [index, setIndex] = React.useState<PostIndex | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [view, setView] = React.useState<View>({ mode: "list" })
  const [query, setQuery] = React.useState("")
  const [refreshing, setRefreshing] = React.useState(false)
  /* 고정을 바꾸는 중인 글. 연타로 두 번 보내면 마지막 응답이 이기므로 하나씩 받는다. */
  const [pinning, setPinning] = React.useState<string | null>(null)
  /* 뉴스와 하드:라이브러리는 같은 표를 쓰고 화면만 갈린다. 한 목록에 섞어 놓으면
     150건이 한 줄로 늘어서 어느 쪽 글인지 알 수 없다. */
  const [tab, setTab] = React.useState<Post["category"]>("news")
  /* 현황 패널의 "손볼 것" 을 누르면 목록이 그 글만 남는다. 탭을 옮기면 푼다 —
     결함 수는 탭마다 다르고, 옮긴 탭에서 0건인 필터가 켜져 있으면 빈 목록만 보인다. */
  const [issue, setIssue] = React.useState<IssueKey | null>(null)

  const refresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      setIndex(await loadPosts(cfg))
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "기사를 불러오지 못했습니다"
      )
    } finally {
      setRefreshing(false)
    }
  }, [cfg])

  React.useEffect(() => {
    // 효과 본문에서 곧바로 setState 하지 않기 위해 한 틱 미룬다.
    void Promise.resolve().then(refresh)
  }, [refresh])

  function startNew(kind: "post" | "deck", category: Post["category"] = tab) {
    const now = new Date()
    setView({
      mode: "edit",
      kind,
      post: newPost(newPostId(now), formatDate(now), "ko", category),
      isNew: true,
    })
  }

  /**
   * 목록 맨 위 고정. 켜면 사이트 카드에 「HADD PICK」 배지와 강조 테두리가 붙는다.
   *
   * 저장 뒤 목록을 다시 받는다 — 순서는 서버가 정하므로(고정 먼저), 화면에서 흉내 내면
   * 새로고침할 때 자리가 달라진다. 개수 제한은 없다.
   */
  async function togglePin(post: Post) {
    if (pinning) return
    setPinning(post.id)
    try {
      await setPinned(cfg, post.id, !post.pinned)
      toast.success(post.pinned ? "고정을 풀었습니다" : "목록 맨 위에 고정했습니다")
      await refresh()
    } catch (err) {
      toast.error("고정을 바꾸지 못했습니다", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setPinning(null)
    }
  }

  async function remove(post: Post) {
    if (!index) return
    const title = post.content[post.sourceLang]?.title ?? post.id
    if (
      !confirm(
        `"${title}" 기사를 삭제할까요?\n사진도 함께 지워지고 되돌릴 수 없습니다.`
      )
    )
      return
    try {
      await deletePost(cfg, post.id)
      toast.success("삭제했습니다")
      await refresh()
    } catch (err) {
      toast.error("삭제하지 못했습니다", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  if (view.mode === "edit" && index) {
    // 카드뉴스로 만든 글은 이미지가 아니라 원본 덱을 연다. 글 편집기로 열면
    // 이미지 블록만 보여 고칠 수가 없다.
    const Editor = view.kind === "deck" ? DeckEditor : PostEditor
    return (
      <main className="mx-auto max-w-6xl px-6 pb-24">
        <Editor
          cfg={cfg}
          post={view.post}
          order={index.order}
          isNew={view.isNew}
          onCancel={() => setView({ mode: "list" })}
          onDone={() => {
            setView({ mode: "list" })
            void refresh()
          }}
        />
      </main>
    )
  }

  const posts = index?.posts ?? []
  const count = (c: Post["category"]) =>
    posts.filter((p) => p.category === c).length
  const inTab = posts.filter((p) => p.category === tab)
  const q = query.trim().toLowerCase()
  const filtered = inTab
    .filter((p) => (issue ? matchesIssue(p, issue) : true))
    .filter((p) =>
      q
        ? Object.values(p.content).some((l) =>
            l?.title.toLowerCase().includes(q)
          )
        : true
    )

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24">
      <header className="flex flex-wrap items-center gap-3 py-8">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            HADD SCIENCE
          </p>
          <h1 className="text-2xl font-bold tracking-[-0.02em]">콘텐츠 관리</h1>
        </div>
        <a
          href={`${OMNIS_ORIGIN}/settings`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          계정 설정 <ExternalLink className="size-3" />
        </a>
        <span className="text-sm text-muted-foreground">{who}</span>
        <Button variant="ghost" size="sm" onClick={onSignOut}>
          <LogOut className="size-4" />
          나가기
        </Button>
      </header>

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
            onClick={() => {
              setTab(t.id)
              setIssue(null)
            }}
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

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목으로 찾기"
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => void refresh()}
          disabled={refreshing}
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          새로고침
        </Button>
        {tab === "news" ? (
          <Button variant="outline" onClick={() => startNew("deck", "news")}>
            <LayoutGrid className="size-4" />새 카드뉴스
          </Button>
        ) : null}
        <Button onClick={() => startNew("post", tab)}>
          <Plus className="size-4" />
          {tab === "library" ? "새 라이브러리 글" : "새 기사"}
        </Button>
      </div>

      {index ? <SiteStats cfg={cfg} posts={posts} /> : null}

      {index ? (
        <ContentStats
          posts={inTab}
          total={posts.length}
          label={tab === "library" ? "하드:라이브러리" : "뉴스"}
          issue={issue}
          onIssue={setIssue}
        />
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-destructive/8 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {!index ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ul className="grid gap-2">
          {!filtered.length ? (
            <li className="rounded-lg border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
              {issue
                ? "이 조건에 걸리는 글이 없습니다."
                : query.trim()
                  ? "찾는 제목이 없습니다."
                  : tab === "library"
                    ? "하드:라이브러리 글이 없습니다. 오른쪽 위에서 새로 쓸 수 있습니다."
                    : "기사가 없습니다."}
            </li>
          ) : null}
          {filtered.map((post) => {
            const locale = post.content[post.sourceLang]
            const translated = Object.entries(post.content)
              .filter(([, l]) => (l?.blocks.length ?? 0) > 0)
              .map(([l]) => l)
            const hasBody = (locale?.blocks.length ?? 0) > 0
            // li 에 min-w-0 이 없으면 제목이 긴 글에서 li 의 최소 너비(=truncate 한 제목의
            // 한 줄 전체 너비)가 그리드 칸을 밀어내 목록이 화면 오른쪽으로 삐져나간다.
            return (
              <li
                key={post.id}
                className={cn(
                  "flex min-w-0 items-center gap-4 rounded-lg border bg-card p-3",
                  post.pinned ? "border-primary" : "border-border"
                )}
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-[12px] bg-muted">
                  {post.thumbnail ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- 정적 export 라 최적화가 없고, 여기서는 관리자만 본다 */
                    <img
                      src={post.thumbnail}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageOff className="absolute inset-0 m-auto size-4 text-muted-foreground" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setView({
                      mode: "edit",
                      kind: post.deck ? "deck" : "post",
                      post,
                      isNew: false,
                    })
                  }
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-semibold hover:text-primary">
                    {locale?.title || post.id}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
                    {post.pinned ? (
                      <span className="rounded-[4px] bg-primary px-1.5 py-0.5 font-semibold text-primary-foreground">
                        HADD PICK
                      </span>
                    ) : null}
                    <span>{post.date}</span>
                    <span aria-hidden>·</span>
                    <span>
                      {translated.join(" / ").toUpperCase() || "본문 없음"}
                    </span>
                    {post.deck ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>카드뉴스 {post.deck.cards.length}장</span>
                      </>
                    ) : null}
                    {!hasBody && post.externalHref ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>외부 링크</span>
                      </>
                    ) : null}
                  </p>
                </button>

                <button
                  type="button"
                  title={post.pinned ? "고정 풀기" : "목록 맨 위에 고정"}
                  aria-pressed={post.pinned}
                  disabled={pinning !== null}
                  onClick={() => void togglePin(post)}
                  className={cn(
                    "grid size-9 place-items-center rounded-[12px] disabled:opacity-40",
                    post.pinned
                      ? "text-primary hover:bg-primary/10"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {pinning === post.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : post.pinned ? (
                    <PinOff className="size-4" />
                  ) : (
                    <Pin className="size-4" />
                  )}
                </button>
                {hasBody ? (
                  <a
                    href={`/ko/${post.category === "library" ? "library" : "news"}/${post.id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="사이트에서 보기"
                    className="grid size-9 place-items-center rounded-[12px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <FileText className="size-4" />
                  </a>
                ) : null}
                <button
                  type="button"
                  title="삭제"
                  onClick={() => void remove(post)}
                  className="grid size-9 place-items-center rounded-[12px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

"use client"

import {
  FileText,
  ImageOff,
  LayoutGrid,
  Loader2,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { matchesIssue, type IssueKey } from "@/components/admin/content-stats"
import { DeckEditor } from "@/components/admin/deck-editor"
import { PostEditor } from "@/components/admin/post-editor"
import { AdminShell } from "@/components/admin/shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useVisitStats } from "@/hooks/use-visit-stats"
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
import { cn } from "@/lib/utils"

/**
 * 콘텐츠 화면 — 글을 쓰고 고치는 곳.
 *
 * 숫자는 여기 없다. 통계는 `/admin/stats` 로 갈라 두었다 — 글 하나 고치러 들어와서
 * 통계부터 읽고 내려오지 않게 한다. 다만 목록의 각 줄에는 그 글이 몇 번 읽혔는지가
 * 붙는다(그건 그 글에 대한 정보라 관리하면서 같이 보는 편이 낫다).
 *
 * 통계 화면의 "손볼 것" 은 여기로 주소를 달고 넘어온다 — `/admin?issue=no-body&tab=news`.
 */
export default function AdminPage() {
  return (
    <AdminShell current="/admin" title="콘텐츠 관리">
      {(cfg) => (
        // useSearchParams 는 Suspense 경계를 요구한다(정적으로 미리 그리는 페이지라서).
        <React.Suspense
          fallback={
            <div className="grid place-items-center py-24">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <Workspace cfg={cfg} />
        </React.Suspense>
      )}
    </AdminShell>
  )
}

/* ------------------------------------------------------------ 작업 화면 */

type View =
  | { mode: "list" }
  | { mode: "edit"; kind: "post" | "deck"; post: Post; isNew: boolean }

function Workspace({ cfg }: { cfg: ApiConfig }) {
  // 통계 화면에서 "손볼 것" 을 눌러 넘어온 경우. 주소에 남으므로 북마크도 되고
  // "번역 없는 글 목록" 을 그대로 남에게 보낼 수도 있다.
  const params = useSearchParams()
  const asked = params.get("issue")
  const [index, setIndex] = React.useState<PostIndex | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [view, setView] = React.useState<View>({ mode: "list" })
  const [query, setQuery] = React.useState("")
  const [refreshing, setRefreshing] = React.useState(false)
  /* 고정을 바꾸는 중인 글. 연타로 두 번 보내면 마지막 응답이 이기므로 하나씩 받는다. */
  const [pinning, setPinning] = React.useState<string | null>(null)
  /* 뉴스와 하드:라이브러리는 같은 표를 쓰고 화면만 갈린다. 한 목록에 섞어 놓으면
     150건이 한 줄로 늘어서 어느 쪽 글인지 알 수 없다. */
  const [tab, setTab] = React.useState<Post["category"]>(
    params.get("tab") === "library" ? "library" : "news"
  )
  /* 현황 패널의 "손볼 것" 을 누르면 목록이 그 글만 남는다. 탭을 옮기면 푼다 —
     결함 수는 탭마다 다르고, 옮긴 탭에서 0건인 필터가 켜져 있으면 빈 목록만 보인다. */
  const [issue, setIssue] = React.useState<IssueKey | null>(
    asked === "untranslated" ||
      asked === "no-body" ||
      asked === "no-thumbnail" ||
      asked === "no-summary"
      ? asked
      : null
  )
  /* 목록 순서는 사이트에 나가는 순서(position)다. 여기서 많이 본 순으로 바꿔도
     사이트는 그대로다 — 화면에서만 다시 세운다. */
  const [sort, setSort] = React.useState<"order" | "views">("order")
  const stats = useVisitStats(cfg)

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
      toast.success(
        post.pinned ? "고정을 풀었습니다" : "목록 맨 위에 고정했습니다"
      )
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
    )
  }

  const posts = index?.posts ?? []
  const count = (c: Post["category"]) =>
    posts.filter((p) => p.category === c).length
  const inTab = posts.filter((p) => p.category === tab)
  const q = query.trim().toLowerCase()
  const views = (p: Post) => stats.byPost.get(p.id)?.views ?? 0
  const filtered = inTab
    .filter((p) => (issue ? matchesIssue(p, issue) : true))
    .filter((p) =>
      q
        ? Object.values(p.content).some((l) =>
            l?.title.toLowerCase().includes(q)
          )
        : true
    )
  // sort 는 원본을 건드리지 않는다. inTab 은 index 의 배열을 그대로 쓰므로
  // 여기서 sort() 하면 다른 화면이 보는 순서까지 바뀐다.
  const rows =
    sort === "views"
      ? [...filtered].sort((a, b) => views(b) - views(a))
      : filtered

  const ISSUE_LABEL: Record<IssueKey, string> = {
    untranslated: "번역 없음",
    "no-body": "본문 없음",
    "no-thumbnail": "썸네일 없음",
    "no-summary": "요약 없음",
  }

  return (
    <>
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
        {stats.data ? (
          <div className="flex items-center gap-1 rounded-full border border-border p-1">
            {(
              [
                { id: "order", label: "목록 순서" },
                { id: "views", label: "많이 본 순" },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSort(o.id)}
                aria-pressed={sort === o.id}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-120 ease-[var(--ease-standard)]",
                  sort === o.id
                    ? "bg-brand-blue-700 text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : null}
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

      {issue ? (
        <p className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <span className="font-semibold">{ISSUE_LABEL[issue]}</span>
          <span className="text-muted-foreground">
            인 글만 보고 있습니다 ({rows.length}건)
          </span>
          <button
            type="button"
            onClick={() => setIssue(null)}
            className="ml-auto text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            전체 보기
          </button>
        </p>
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
          {!rows.length ? (
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
          {rows.map((post) => {
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

                {/* 이 글이 그 기간에 몇 번 열렸는가. 통계가 아직 없으면 자리를 비워 둔다 —
                    0 을 적으면 "아무도 안 봤다"와 "아직 못 받았다"가 구별되지 않는다. */}
                {stats.data ? (
                  <span
                    title={
                      stats.byPost.get(post.id)
                        ? `최근 ${stats.days}일 · 방문자 ${stats.byPost.get(post.id)?.visitors}명`
                        : `최근 ${stats.days}일 방문 없음`
                    }
                    className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums"
                  >
                    {stats.byPost.get(post.id)
                      ? `${stats.byPost.get(post.id)?.views}회`
                      : "–"}
                  </span>
                ) : null}

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
    </>
  )
}

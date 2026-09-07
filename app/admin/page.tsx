"use client"

import {
  ExternalLink,
  FileText,
  ImageOff,
  LayoutGrid,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { DeckEditor } from "@/components/admin/deck-editor"
import { PostEditor } from "@/components/admin/post-editor"
import { SignIn } from "@/components/admin/sign-in"
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

  return (
    <Workspace
      cfg={state.cfg}
      who={state.user.name}
      onSignOut={signOut}
    />
  )
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

  const refresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      setIndex(await loadPosts(cfg))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "기사를 불러오지 못했습니다")
    } finally {
      setRefreshing(false)
    }
  }, [cfg])

  React.useEffect(() => {
    // 효과 본문에서 곧바로 setState 하지 않기 위해 한 틱 미룬다.
    void Promise.resolve().then(refresh)
  }, [refresh])

  function startNew(kind: "post" | "deck") {
    const now = new Date()
    setView({
      mode: "edit",
      kind,
      post: newPost(newPostId(now), formatDate(now), "ko"),
      isNew: true,
    })
  }

  async function remove(post: Post) {
    if (!index) return
    const title = post.content[post.sourceLang]?.title ?? post.id
    if (!confirm(`"${title}" 기사를 삭제할까요?\n사진도 함께 지워지고 되돌릴 수 없습니다.`)) return
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
  const filtered = query.trim()
    ? posts.filter((p) =>
        Object.values(p.content).some((l) =>
          l?.title.toLowerCase().includes(query.trim().toLowerCase())
        )
      )
    : posts

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
        <Button variant="outline" onClick={() => startNew("deck")}>
          <LayoutGrid className="size-4" />새 카드뉴스
        </Button>
        <Button onClick={() => startNew("post")}>
          <Plus className="size-4" />새 기사
        </Button>
      </div>

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
          {filtered.map((post) => {
            const locale = post.content[post.sourceLang]
            const translated = Object.entries(post.content)
              .filter(([, l]) => (l?.blocks.length ?? 0) > 0)
              .map(([l]) => l)
            const hasBody = (locale?.blocks.length ?? 0) > 0
            return (
              <li
                key={post.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
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
                    <span>{post.date}</span>
                    <span aria-hidden>·</span>
                    <span>{translated.join(" / ").toUpperCase() || "본문 없음"}</span>
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

                {hasBody ? (
                  <a
                    href={`/ko/news/${post.id}/`}
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

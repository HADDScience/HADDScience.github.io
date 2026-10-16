"use client"

import {
  AlertTriangle,
  BookmarkCheck,
  BookmarkPlus,
  ExternalLink,
  FilePen,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { ColumnDraftEditor } from "@/components/admin/column-draft-editor"
import { AdminShell } from "@/components/admin/shell"
import { Button } from "@/components/ui/button"
import type { ApiConfig } from "@/lib/admin-config"
import {
  collect,
  createDraft,
  DRAFT_LABEL,
  keywordAction,
  KEYWORD_LABEL,
  loadBoard,
  loadDrafts,
  type Board,
  type DraftStatus,
  type DraftSummary,
  type Keyword,
  type KeywordAction,
  type Me,
} from "@/lib/admin-column"
import { cn } from "@/lib/utils"

/**
 * 칼럼 화면 — 키워드 추천 → AI 초안 → 대표님 검토 → 하드:라이브러리 게시.
 *
 * 각자 필요할 때 쓰는 도구다(2026-10-16 결정, 로테이션 없음). 누가 예약했고 누가 초안을
 * 만들었는지만 남는다. 공개 화면에는 글쓴이가 나가지 않는다.
 *
 * 화면은 둘이다. **키워드**는 후보를 고르는 곳, **초안**은 쓰고 검토받는 곳.
 * 주소의 `?draft=<id>` 로 초안을 바로 연다 — Omnis 검토 알림이 그 주소로 온다.
 */
export function ColumnScreen() {
  return (
    <AdminShell current="/admin/column" title="칼럼">
      {(cfg) => (
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

type Pane = "keywords" | "drafts"
type Filter = "open" | "mine" | "used" | "discarded"

function Workspace({ cfg }: { cfg: ApiConfig }) {
  const params = useSearchParams()
  const router = useRouter()
  const openDraft = params.get("draft")
  const [pane, setPane] = React.useState<Pane>(params.get("pane") === "drafts" ? "drafts" : "keywords")
  const [board, setBoard] = React.useState<Board | null>(null)
  const [drafts, setDrafts] = React.useState<DraftSummary[] | null>(null)
  const [me, setMe] = React.useState<Me | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [collecting, setCollecting] = React.useState(false)

  const refresh = React.useCallback(async () => {
    try {
      const [b, d] = await Promise.all([loadBoard(cfg), loadDrafts(cfg)])
      setBoard(b)
      setDrafts(d.drafts)
      setMe(d.me)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "불러오지 못했습니다")
    }
  }, [cfg])

  React.useEffect(() => {
    void Promise.resolve().then(refresh)
  }, [refresh])

  const go = (q: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(q)) {
      if (v === null) next.delete(k)
      else next.set(k, v)
    }
    router.replace(`/admin/column${next.size ? `?${next}` : ""}`)
  }

  async function runCollect() {
    setCollecting(true)
    try {
      const b = await collect(cfg)
      setBoard(b)
      toast.success(b.reused ? "오늘 이미 수집했습니다 — 그 결과를 보여 줍니다" : "후보를 새로 모았습니다")
    } catch (err) {
      toast.error("후보를 모으지 못했습니다", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setCollecting(false)
    }
  }

  async function act(k: Keyword, body: KeywordAction, done: string) {
    setBusy(k.id)
    try {
      await keywordAction(cfg, k.id, body)
      toast.success(done)
      await refresh()
    } catch (err) {
      toast.error("바꾸지 못했습니다", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(null)
    }
  }

  async function startDraft(k: Keyword) {
    setBusy(k.id)
    const t = toast.loading("근거 기사를 읽고 초안을 쓰는 중입니다 (30~60초)")
    try {
      const { draft } = await createDraft(cfg, k.id)
      toast.success("초안을 만들었습니다", { id: t })
      await refresh()
      go({ draft: draft.id, pane: null })
    } catch (err) {
      toast.error("초안을 만들지 못했습니다", { id: t, description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(null)
    }
  }

  if (openDraft) {
    return (
      <ColumnDraftEditor
        cfg={cfg}
        id={openDraft}
        onClose={() => {
          go({ draft: null, pane: "drafts" })
          setPane("drafts")
          void refresh()
        }}
      />
    )
  }

  const openDrafts = (drafts ?? []).filter((d) => d.status !== "published").length

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            { id: "keywords", label: "키워드", n: board?.keywords.filter((k) => k.status === "candidate").length },
            { id: "drafts", label: "초안", n: openDrafts },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setPane(t.id)
              go({ pane: t.id === "drafts" ? "drafts" : null })
            }}
            className={cn(
              "flex items-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold transition-colors duration-120 ease-[var(--ease-standard)]",
              pane === t.id
                ? "border-brand-blue-700 bg-brand-blue-700 text-white"
                : "border-border bg-card hover:border-brand-blue-500"
            )}
          >
            {t.label}
            {t.n !== undefined ? (
              <span className={cn("rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold", pane === t.id ? "bg-white/20" : "bg-muted")}>
                {t.n}
              </span>
            ) : null}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={() => void refresh()}>
            <RefreshCw className="size-4" />
            새로고침
          </Button>
          {pane === "keywords" ? (
            <Button onClick={() => void runCollect()} disabled={collecting}>
              {collecting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {collecting ? "모으는 중… (30초 안팎)" : "후보 수집"}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-destructive/8 p-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!board || !drafts ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : pane === "keywords" ? (
        <KeywordBoard board={board} me={me} busy={busy} onAct={act} onDraft={startDraft} onOpen={(id) => go({ draft: id })} />
      ) : (
        <DraftList drafts={drafts} me={me} onOpen={(id) => go({ draft: id })} />
      )}
    </>
  )
}

/* ------------------------------------------------------------ 키워드 보드 */

const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "추천" },
  { id: "mine", label: "내 예약" },
  { id: "used", label: "사용됨" },
  { id: "discarded", label: "버림" },
]

function KeywordBoard({
  board,
  me,
  busy,
  onAct,
  onDraft,
  onOpen,
}: {
  board: Board
  me: Me | null
  busy: string | null
  onAct: (k: Keyword, body: KeywordAction, done: string) => Promise<void>
  onDraft: (k: Keyword) => Promise<void>
  onOpen: (draftId: string) => void
}) {
  const [filter, setFilter] = React.useState<Filter>("open")
  const [topic, setTopic] = React.useState<string | null>(null)
  const topics = [...new Set(board.keywords.map((k) => k.topic))]
  const rows = board.keywords
    .filter((k) =>
      filter === "open"
        ? k.status === "candidate" || k.status === "reserved"
        : filter === "mine"
          ? k.status === "reserved" && k.reservedById === me?.id
          : k.status === filter
    )
    .filter((k) => (topic ? k.topic === topic : true))

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-border p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-120 ease-[var(--ease-standard)]",
                filter === f.id ? "bg-brand-blue-700 text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={topic === t}
              onClick={() => setTopic(topic === t ? null : t)}
              className={cn(
                "rounded-[6px] border px-2 py-0.5 text-xs font-semibold transition-colors duration-120",
                topic === t ? "border-brand-blue-700 bg-brand-blue-700/10 text-brand-blue-700" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="ml-auto font-mono text-xs text-muted-foreground">
          {board.lastRun
            ? `마지막 수집 ${new Date(board.lastRun.startedAt).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}${board.lastRun.createdBy ? ` · ${board.lastRun.createdBy}` : ""} · 하루 한 번`
            : "아직 수집한 적이 없습니다"}
        </p>
      </div>

      {!rows.length ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
          {board.keywords.length ? "이 조건에 맞는 키워드가 없습니다." : "「후보 수집」을 누르면 최근 2주 기사에서 칼럼 키워드를 찾아옵니다."}
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((k) => (
            <KeywordCard key={k.id} k={k} me={me} busy={busy === k.id} onAct={onAct} onDraft={onDraft} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </>
  )
}

function KeywordCard({
  k,
  me,
  busy,
  onAct,
  onDraft,
  onOpen,
}: {
  k: Keyword
  me: Me | null
  busy: boolean
  onAct: (k: Keyword, body: KeywordAction, done: string) => Promise<void>
  onDraft: (k: Keyword) => Promise<void>
  onOpen: (draftId: string) => void
}) {
  const [showSources, setShowSources] = React.useState(false)
  const mine = k.reservedById === me?.id
  const takenByOther = k.status === "reserved" && !mine
  const myDraft = k.drafts.find((d) => d.status !== "published")

  return (
    <li className={cn("flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-4", mine ? "border-primary" : "border-border")}>
      <div className="flex items-start gap-2">
        <span className="shrink-0 rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">{k.topic}</span>
        <h3 className="min-w-0 flex-1 font-semibold leading-snug break-keep">{k.term}</h3>
        {k.status !== "candidate" ? (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              k.status === "reserved" ? "bg-brand-blue-700/10 text-brand-blue-700" : "bg-muted text-muted-foreground"
            )}
          >
            {k.status === "reserved" ? `예약 · ${k.reservedBy ?? "?"}` : KEYWORD_LABEL[k.status]}
          </span>
        ) : null}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{k.summary}</p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
        <span>{k.timelyAt ? `최근 근거 ${k.timelyAt.slice(5, 10).replace("-", "/")}` : "날짜 없음"}</span>
        <button type="button" onClick={() => setShowSources((v) => !v)} className="underline underline-offset-4 hover:text-foreground">
          근거 {k.sources.length}건 {showSources ? "접기" : "보기"}
        </button>
        <span>사용 {k.usedCount}회</span>
        {k.similarWarn ? (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400" title={`유사도 ${k.nearestScore}`}>
            <AlertTriangle className="size-3" />
            기존 글과 비슷함: {k.nearestTitle?.slice(0, 24)}…
          </span>
        ) : null}
      </div>

      {showSources ? (
        <ul className="grid gap-1.5 rounded-md bg-muted/50 p-2">
          {k.sources.map((s) => (
            <li key={s.url} className="flex items-start gap-2 text-xs">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 hover:text-primary">
                <span className="font-semibold">{s.publisher}</span>
                {s.date ? <span className="text-muted-foreground"> · {s.date.slice(5, 10).replace("-", "/")}</span> : null}
                <span className="block truncate text-muted-foreground">
                  {s.title} <ExternalLink className="inline size-3" />
                </span>
              </a>
              {k.status === "candidate" || mine ? (
                <button
                  type="button"
                  disabled={busy || k.sources.length < 2}
                  onClick={() => void onAct(k, { action: "removeSource", url: s.url }, "근거를 뺐습니다")}
                  title={k.sources.length < 2 ? "근거가 하나뿐이면 뺄 수 없습니다" : "주제와 맞지 않는 근거 빼기"}
                  aria-label="이 근거 빼기"
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2">
        {k.status === "discarded" ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void onAct(k, { action: "restore" }, "되돌렸습니다")}>
            <Undo2 className="size-4" />
            되돌리기
          </Button>
        ) : k.status === "used" ? null : (
          <>
            {myDraft ? (
              <Button size="sm" onClick={() => onOpen(myDraft.id)}>
                <FilePen className="size-4" />
                초안 열기 · {DRAFT_LABEL[myDraft.status]}
              </Button>
            ) : (
              <Button size="sm" disabled={busy || takenByOther} onClick={() => void onDraft(k)}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                초안 만들기
              </Button>
            )}
            {k.status === "candidate" ? (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void onAct(k, { action: "reserve" }, "예약했습니다")}>
                <BookmarkPlus className="size-4" />
                예약
              </Button>
            ) : mine && !k.drafts.length ? (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void onAct(k, { action: "release" }, "예약을 풀었습니다")}>
                <BookmarkCheck className="size-4" />
                예약 풀기
              </Button>
            ) : null}
            {!takenByOther && !k.drafts.length ? (
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => void onAct(k, { action: "discard" }, "버렸습니다")}>
                <Trash2 className="size-4" />
                버리기
              </Button>
            ) : null}
          </>
        )}
      </div>
    </li>
  )
}

/* ------------------------------------------------------------ 초안 목록 */

const STATUS_TONE: Record<DraftStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  changes_requested: "bg-destructive/10 text-destructive",
  approved: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  published: "bg-brand-blue-700/10 text-brand-blue-700",
}

function DraftList({ drafts, me, onOpen }: { drafts: DraftSummary[]; me: Me | null; onOpen: (id: string) => void }) {
  const waiting = me?.isReviewer ? drafts.filter((d) => d.status === "in_review") : []
  if (!drafts.length) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
        초안이 없습니다. 키워드 카드에서 「초안 만들기」를 누르세요.
      </p>
    )
  }
  return (
    <>
      {waiting.length ? (
        <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold">
          검토를 기다리는 칼럼이 {waiting.length}건 있습니다.
        </p>
      ) : null}
      <ul className="grid gap-2">
        {drafts.map((d) => (
          <li key={d.id} className="flex min-w-0 items-center gap-4 rounded-lg border border-border bg-card p-3">
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_TONE[d.status])}>{DRAFT_LABEL[d.status]}</span>
            <button type="button" onClick={() => onOpen(d.id)} className="min-w-0 flex-1 text-left">
              <p className="truncate font-semibold hover:text-primary">{d.title || "(제목 없음)"}</p>
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                {d.keyword.term} · {d.createdBy ?? "?"} · {new Date(d.updatedAt).toLocaleDateString("ko-KR")}
                {d.reviewNote ? ` · 메모: ${d.reviewNote}` : ""}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

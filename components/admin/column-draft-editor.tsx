"use client"

import { ArrowLeft, Check, ExternalLink, Eye, FileDown, Loader2, Save, Send, Trash2, Undo2, Upload } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { BlockEditor } from "@/components/admin/block-editor"
import { PostBody } from "@/components/ds/post-body"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PostBlock } from "@/content/types"
import type { ApiConfig } from "@/lib/admin-config"
import {
  decide,
  deleteDraft,
  DRAFT_LABEL,
  loadDraft,
  publish,
  requestReview,
  saveDraft,
  uploadDraftImage,
  type Draft,
  type Me,
} from "@/lib/admin-column"
import { prepareImage } from "@/lib/admin-image"
import { cn } from "@/lib/utils"

/**
 * 칼럼 초안 편집기.
 *
 * 기사 편집기(PostEditor)와 달리 언어 탭이 없다 — 한국어로만 쓰고, 영문은 게시할 때 서버가
 * 번역한다. 본문의 [1] 같은 근거 번호는 검토용 표시라 게시할 때 서버가 지운다.
 *
 * 고칠 수 있는 것은 「초안」·「수정 요청」 상태뿐이다. 검토에 들어가면 잠긴다 — 대표님이 보는
 * 동안 글이 바뀌면 무엇을 승인했는지 알 수 없다.
 */
export function ColumnDraftEditor({ cfg, id, onClose }: { cfg: ApiConfig; id: string; onClose: () => void }) {
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [me, setMe] = React.useState<Me | null>(null)
  const [problems, setProblems] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [dirty, setDirty] = React.useState(false)
  const [working, setWorking] = React.useState<string | null>(null)
  const [note, setNote] = React.useState("")
  const [preview, setPreview] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const r = await loadDraft(cfg, id)
      setDraft(r.draft)
      setProblems(r.problems)
      setMe(r.me)
      setDirty(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "초안을 불러오지 못했습니다")
    }
  }, [cfg, id])

  React.useEffect(() => {
    void Promise.resolve().then(load)
  }, [load])

  if (error) {
    return (
      <div className="grid gap-4">
        <BackButton onClose={onClose} />
        <p role="alert" className="rounded-lg bg-destructive/8 p-4 text-sm text-destructive">
          {error}
        </p>
      </div>
    )
  }
  if (!draft) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const editable = draft.status === "draft" || draft.status === "changes_requested"
  const set = (patch: Partial<Draft>) => {
    setDraft({ ...draft, ...patch })
    setDirty(true)
  }

  async function run(label: string, fn: () => Promise<unknown>, done: string) {
    setWorking(label)
    try {
      await fn()
      toast.success(done)
      await load()
      return true
    } catch (err) {
      toast.error(`${label}하지 못했습니다`, { description: err instanceof Error ? err.message : undefined })
      return false
    } finally {
      setWorking(null)
    }
  }

  const save = () =>
    run("저장", () => saveDraft(cfg, draft.id, { title: draft.title, summary: draft.summary, blocks: draft.blocks }), "저장했습니다")

  const draftId = draft.id
  async function submit() {
    if (dirty && !(await save())) return
    await run("검토 요청", () => requestReview(cfg, draftId), "대표님께 검토를 요청했습니다")
  }

  /** 화면에 보이는 그대로(저장 안 한 변경 포함) 워드로 내려받는다. docx 라이브러리는 누를 때만 불러온다. */
  async function exportDocx() {
    if (!draft) return
    setWorking("내보내기")
    try {
      const { buildColumnDocx, columnDocxName } = await import("@/lib/column-docx")
      const blob = await buildColumnDocx(draft)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = columnDocxName(draft.title)
      document.body.appendChild(a)
      a.click()
      a.remove()
      // 클릭 직후 revoke 하면 일부 브라우저가 다운로드를 시작하지 못한다.
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      toast.success("워드 파일을 내려받았습니다", dirty ? { description: "저장하지 않은 변경도 들어 있습니다." } : undefined)
    } catch (err) {
      toast.error("워드로 내보내지 못했습니다", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setWorking(null)
    }
  }

  async function pickImage(file: File): Promise<string> {
    if (!draft?.postId) throw new Error("기사 id 가 없습니다")
    const prepared = await prepareImage(file)
    try {
      return await uploadDraftImage(cfg, draft.postId, prepared.bytes)
    } finally {
      URL.revokeObjectURL(prepared.previewUrl)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <BackButton onClose={onClose} dirty={dirty} />
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{DRAFT_LABEL[draft.status]}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {draft.keyword.term} · {draft.createdBy ?? "?"}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPreview((v) => !v)}>
            <Eye className="size-4" />
            {preview ? "편집" : "미리보기"}
          </Button>
          <Button variant="outline" disabled={!!working} onClick={() => void exportDocx()}>
            {working === "내보내기" ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
            워드로 내보내기
          </Button>
          {editable ? (
            <>
              <Button variant="outline" disabled={!dirty || !!working} onClick={() => void save()}>
                {working === "저장" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                저장
              </Button>
              <Button disabled={!!working} onClick={() => void submit()}>
                <Send className="size-4" />
                검토 요청
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {draft.status === "changes_requested" && draft.reviewNote ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <span className="font-semibold">수정 요청 ({draft.reviewer ?? "대표님"})</span> — {draft.reviewNote}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 content-start gap-4">
          {preview ? (
            <article className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-2xl font-bold tracking-[-0.02em]">{draft.title}</h2>
              <p className="mt-2 text-muted-foreground">{draft.summary}</p>
              <div className="mt-6">
                <PostBody blocks={draft.blocks} resolveSrc={(s) => s} />
              </div>
            </article>
          ) : (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="col-title">제목</Label>
                <Input id="col-title" value={draft.title} disabled={!editable} onChange={(e) => set({ title: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="col-summary">부제</Label>
                <Textarea id="col-summary" rows={2} value={draft.summary} disabled={!editable} onChange={(e) => set({ summary: e.target.value })} />
              </div>
              {editable ? (
                <BlockEditor
                  blocks={draft.blocks}
                  onChange={(blocks: PostBlock[]) => set({ blocks })}
                  onPickImage={pickImage}
                  resolveSrc={(s) => s}
                  captionIsSource
                />
              ) : (
                <div className="rounded-lg border border-border bg-card p-6">
                  <PostBody blocks={draft.blocks} resolveSrc={(s) => s} />
                </div>
              )}
            </>
          )}
        </div>

        <aside className="grid content-start gap-4">
          <Panel title="다음 단계">
            {editable ? (
              problems.length || dirty ? (
                <ul className="grid gap-1 text-sm">
                  {dirty ? <li className="text-muted-foreground">저장하지 않은 변경이 있습니다.</li> : null}
                  {problems.map((p) => (
                    <li key={p} className="text-destructive">
                      · {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">검토를 요청할 수 있습니다. 대표님께 Omnis 알림이 갑니다.</p>
              )
            ) : draft.status === "in_review" ? (
              me?.isReviewer ? (
                <div className="grid gap-2">
                  <Textarea rows={3} placeholder="수정 요청 메모 (승인할 때는 비워도 됩니다)" value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={!!working}
                      onClick={() => void run("승인", () => decide(cfg, draft.id, "approve", note), "승인했습니다")}
                    >
                      <Check className="size-4" />
                      승인
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={!!working || !note.trim()}
                      onClick={() => void run("수정 요청", () => decide(cfg, draft.id, "request_changes", note), "수정을 요청했습니다")}
                    >
                      <Undo2 className="size-4" />
                      수정 요청
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">대표님이 검토 중입니다. 결과는 Omnis 알림으로 옵니다.</p>
              )
            ) : draft.status === "approved" ? (
              <div className="grid gap-2">
                <p className="text-sm text-muted-foreground">
                  승인됐습니다. 게시하면 하드:라이브러리 맨 앞에 오늘 날짜로 올라가고 영문은 자동 번역됩니다. 근거 번호 [1] 은 지워집니다.
                </p>
                <Button
                  disabled={!!working}
                  onClick={() => {
                    if (!confirm(`「${draft.title}」을 하드:라이브러리에 게시할까요?\n게시하면 사이트에 바로 보입니다.`)) return
                    void run("게시", () => publish(cfg, draft.id), "라이브러리에 게시했습니다")
                  }}
                >
                  {working === "게시" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  라이브러리에 게시
                </Button>
              </div>
            ) : (
              <a
                href={`/ko/library/${draft.postId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
              >
                게시된 글 보기 <ExternalLink className="size-3.5" />
              </a>
            )}
          </Panel>

          <Panel title={`근거 기사 ${draft.keyword.sources.length}건`}>
            <ol className="grid gap-2">
              {draft.keyword.sources.slice(0, 5).map((s, i) => (
                <li key={s.url} className="text-xs">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    <span className="font-mono font-bold">[{i + 1}]</span> <span className="font-semibold">{s.publisher}</span>
                    <span className="block text-muted-foreground">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">본문의 [번호]가 이 목록을 가리킵니다. 숫자와 인용은 원문과 대조해 주세요.</p>
          </Panel>

          {draft.status !== "published" && draft.status !== "in_review" ? (
            <Button
              variant="ghost"
              className="justify-start text-destructive"
              disabled={!!working}
              onClick={async () => {
                if (!confirm("이 초안을 버릴까요? 되돌릴 수 없습니다.")) return
                if (await run("삭제", () => deleteDraft(cfg, draft.id), "초안을 버렸습니다")) onClose()
              }}
            >
              <Trash2 className="size-4" />
              초안 버리기
            </Button>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function BackButton({ onClose, dirty }: { onClose: () => void; dirty?: boolean }) {
  return (
    <Button
      variant="ghost"
      onClick={() => {
        if (dirty && !confirm("저장하지 않은 변경이 있습니다. 나갈까요?")) return
        onClose()
      }}
    >
      <ArrowLeft className="size-4" />
      목록
    </Button>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-lg border border-border bg-card p-4")}>
      <h3 className="mb-3 font-mono text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  )
}

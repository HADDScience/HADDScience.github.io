"use client"

import { Check, ChevronDown, Copy, ImageIcon, Trash2, Undo2 } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { ImageSuggestion } from "@/lib/admin-column"
import { cn } from "@/lib/utils"

/**
 * 칼럼 초안의 이미지 제안 상자 — 검토용. 게시되지 않는다.
 *
 * 접을 수 있게 <details> 로 둔다(JS 없이 열리고, 화면 낭독기가 열림 상태를 읽는다).
 * 「완료」로 표시한 제안은 접힌 채로 한 줄만 남는다. 사진을 넣었으면 완료로 접거나 지운다.
 */
export function ImageSuggestionBox({
  s,
  editable,
  onChange,
  onRemove,
}: {
  s: ImageSuggestion
  editable: boolean
  onChange: (next: ImageSuggestion) => void
  onRemove: () => void
}) {
  const where = s.target === "lead" ? "글 맨 앞 · 목록 썸네일" : "이 소제목 아래"
  return (
    <details
      open={!s.done}
      className={cn(
        "group rounded-lg border border-dashed border-border bg-muted/60 text-sm",
        s.done && "opacity-70"
      )}
    >
      <summary className="flex min-h-11 cursor-pointer flex-wrap list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="font-semibold">이미지 제안</span>
        <span className="text-xs text-muted-foreground">{where} · 검토용, 게시되지 않음</span>
        {s.done ? (
          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            <Check className="mr-0.5 inline size-3" />
            완료
          </span>
        ) : null}
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-[var(--ease-standard)] group-open:rotate-180" />
      </summary>

      <div className="grid gap-3 border-t border-dashed border-border px-3 pt-3 pb-3">
        {s.idea ? (
          <Field label="추천">
            <p>{s.idea}</p>
          </Field>
        ) : null}
        {s.sources.length ? (
          <Field label="어디서 구할지">
            <ul className="grid gap-0.5">
              {s.sources.map((src) => (
                <li key={src}>· {src}</li>
              ))}
            </ul>
          </Field>
        ) : null}
        {s.prompt ? <PromptField prompt={s.prompt} /> : null}

        {editable ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...s, done: !s.done })}>
              {s.done ? <Undo2 className="size-4" /> : <Check className="size-4" />}
              {s.done ? "완료 취소" : "사진 넣음 · 완료"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => {
                if (confirm("이 이미지 제안을 지울까요? 저장하면 되돌릴 수 없습니다.")) onRemove()
              }}
            >
              <Trash2 className="size-4" />
              제안 지우기
            </Button>
          </div>
        ) : null}
      </div>
    </details>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <span className="font-mono text-xs font-semibold tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

/**
 * 프롬프트는 영문 그대로 보여 주고 「복사」를 둔다. 클립보드가 막힌 브라우저(권한 거부 · http)에서는
 * 글을 선택해 두고 직접 복사하라고 알린다 — 글은 항상 선택할 수 있는 텍스트다.
 */
function PromptField({ prompt }: { prompt: string }) {
  const ref = React.useRef<HTMLPreElement>(null)
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("프롬프트를 복사했습니다", { description: "ChatGPT · Gemini 에 붙여 넣으세요." })
    } catch {
      const el = ref.current
      const sel = window.getSelection()
      if (el && sel) {
        const range = document.createRange()
        range.selectNodeContents(el)
        sel.removeAllRanges()
        sel.addRange(range)
      }
      toast.error("자동 복사가 막혀 있습니다", { description: "프롬프트를 선택해 두었습니다. Ctrl+C(⌘C)로 복사하세요." })
    }
  }

  return (
    <Field label="AI 생성 프롬프트 (영문)">
      <pre
        ref={ref}
        lang="en"
        className="max-h-48 overflow-auto rounded-[12px] border border-border bg-background p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text"
      >
        {prompt}
      </pre>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "복사됨" : "복사"}
        </Button>
      </div>
    </Field>
  )
}

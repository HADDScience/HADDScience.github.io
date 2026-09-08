"use client"

import {
  ChevronDown,
  ChevronUp,
  Heading2,
  ImagePlus,
  Link2,
  Loader2,
  Quote,
  Trash2,
  Type,
} from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PostBlock } from "@/content/types"
import { cn } from "@/lib/utils"

/**
 * 본문 블록 편집기.
 *
 * Tiptap · BlockNote 같은 리치 에디터를 얹지 않은 이유: 저 도구들은 자체 테마
 * 체계를 갖고 있어 우리 디자인시스템의 토큰·라디우스·버튼 규격을 그대로 입히기
 * 어렵고, 결과물도 HTML 문자열이라 언어별 번역·이미지 분리가 까다로워진다.
 * 우리 블록은 네 종류뿐이라 직접 만드는 편이 작고 정확하다.
 */

const BLOCK_LABEL: Record<PostBlock["type"], string> = {
  heading: "소제목",
  text: "본문",
  quote: "인용",
  image: "이미지",
  links: "링크 목록",
}

/** "이름 | URL" 한 줄이 항목 하나. 편집기에서 표 대신 텍스트로 다루는 게 빠르다. */
function parseLinkLines(text: string): { label: string; href: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, ...rest] = l.split("|")
      return { label: label.trim(), href: rest.join("|").trim() }
    })
}
function linkLines(items: { label: string; href: string }[]): string {
  return items.map((it) => `${it.label} | ${it.href}`).join("\n")
}

export interface BlockEditorProps {
  blocks: PostBlock[]
  onChange: (blocks: PostBlock[]) => void
  /** 파일을 골랐을 때 호출. 저장소에 넣을 경로(`/news/...`)를 돌려준다. */
  onPickImage: (file: File) => Promise<string>
  /** 아직 커밋하지 않은 이미지의 미리보기 주소. */
  resolveSrc: (src: string) => string
}

export function BlockEditor({
  blocks,
  onChange,
  onPickImage,
  resolveSrc,
}: BlockEditorProps) {
  const update = (i: number, next: PostBlock) =>
    onChange(blocks.map((b, j) => (j === i ? next : b)))

  const remove = (i: number) => onChange(blocks.filter((_, j) => j !== i))

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    const next = [...blocks]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  const add = (type: PostBlock["type"]) => {
    const created: PostBlock =
      type === "image"
        ? { type: "image", src: "", alt: "" }
        : type === "quote"
          ? { type: "quote", text: "" }
          : type === "links"
            ? { type: "links", title: "관련 기사", items: [] }
            : { type, text: "" }
    onChange([...blocks, created])
  }

  return (
    <div className="grid gap-4">
      {blocks.map((block, i) => (
        <div
          key={i}
          className="grid gap-3 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {BLOCK_LABEL[block.type]}
            </span>
            <div className="flex items-center gap-1">
              <IconButton
                label="위로"
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ChevronUp className="size-4" />
              </IconButton>
              <IconButton
                label="아래로"
                disabled={i === blocks.length - 1}
                onClick={() => move(i, 1)}
              >
                <ChevronDown className="size-4" />
              </IconButton>
              <IconButton
                label="삭제"
                destructive
                onClick={() => remove(i)}
              >
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          </div>

          {block.type === "image" ? (
            <ImageBlockFields
              block={block}
              onChange={(next) => update(i, next)}
              onPickImage={onPickImage}
              resolveSrc={resolveSrc}
            />
          ) : block.type === "heading" ? (
            <Input
              value={block.text}
              placeholder="소제목"
              onChange={(e) => update(i, { ...block, text: e.target.value })}
              className="text-lg font-semibold"
            />
          ) : block.type === "links" ? (
            <div className="grid gap-2">
              <Input
                value={block.title}
                placeholder="제목 (관련 기사)"
                onChange={(e) => update(i, { ...block, title: e.target.value })}
              />
              <Textarea
                defaultValue={linkLines(block.items)}
                placeholder={"한 줄에 하나. 이름 | URL\n중부일보 | https://…"}
                rows={4}
                onBlur={(e) => update(i, { ...block, items: parseLinkLines(e.target.value) })}
              />
            </div>
          ) : block.type === "quote" ? (
            <div className="grid gap-2">
              <Textarea
                value={block.text}
                placeholder="인용문"
                rows={2}
                onChange={(e) => update(i, { ...block, text: e.target.value })}
              />
              <Input
                value={block.cite ?? ""}
                placeholder="출처 (선택)"
                onChange={(e) =>
                  update(i, { ...block, cite: e.target.value || undefined })
                }
              />
            </div>
          ) : (
            <Textarea
              value={block.text}
              placeholder="본문. 줄바꿈은 그대로 유지됩니다."
              rows={5}
              onChange={(e) => update(i, { ...block, text: e.target.value })}
            />
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <AddButton onClick={() => add("text")} icon={<Type className="size-4" />}>
          본문
        </AddButton>
        <AddButton
          onClick={() => add("heading")}
          icon={<Heading2 className="size-4" />}
        >
          소제목
        </AddButton>
        <AddButton
          onClick={() => add("quote")}
          icon={<Quote className="size-4" />}
        >
          인용
        </AddButton>
        <AddButton
          onClick={() => add("image")}
          icon={<ImagePlus className="size-4" />}
        >
          이미지
        </AddButton>
        <AddButton
          onClick={() => add("links")}
          icon={<Link2 className="size-4" />}
        >
          링크 목록
        </AddButton>
      </div>
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-[12px] text-muted-foreground transition-colors duration-120 ease-[var(--ease-standard)]",
        "hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        destructive && "hover:bg-destructive/10 hover:text-destructive"
      )}
    >
      {children}
    </button>
  )
}

function AddButton({
  onClick,
  icon,
  children,
}: {
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      {icon}
      {children}
    </Button>
  )
}

/**
 * 이미지 블록.
 *
 * 이미지는 언어별로 따로 넣는다 — 카드뉴스처럼 그림 안에 글자가 박혀 있으면
 * 한국어판 이미지를 영문 기사에 그대로 쓸 수 없기 때문이다. 그래서 이 편집기는
 * 항상 "지금 편집 중인 언어" 의 블록만 다룬다.
 */
function ImageBlockFields({
  block,
  onChange,
  onPickImage,
  resolveSrc,
}: {
  block: Extract<PostBlock, { type: "image" }>
  onChange: (block: PostBlock) => void
  onPickImage: (file: File) => Promise<string>
  resolveSrc: (src: string) => string
}) {
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputId = React.useId()

  async function pick(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const src = await onPickImage(file)
      onChange({ ...block, src })
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지를 넣지 못했습니다")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <label
          htmlFor={inputId}
          className="relative grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-[12px] border border-dashed border-border bg-muted text-sm text-muted-foreground hover:border-brand-blue-500"
        >
          {block.src ? (
            /* eslint-disable-next-line @next/next/no-img-element -- 아직 저장소에
               올라가지 않은 blob: URL 을 그리므로 next/image 를 쓸 수 없다 */
            <img
              src={resolveSrc(block.src)}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          ) : busy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <span className="grid justify-items-center gap-1">
              <ImagePlus className="size-5" />
              사진 고르기
            </span>
          )}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void pick(e.target.files?.[0])
            e.target.value = ""
          }}
        />

        <div className="grid content-start gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor={`${inputId}-alt`}>대체 텍스트</Label>
            <Input
              id={`${inputId}-alt`}
              value={block.alt}
              placeholder="사진 설명 (화면 낭독기·검색엔진이 읽습니다)"
              onChange={(e) => onChange({ ...block, alt: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${inputId}-cap`}>캡션 (선택)</Label>
            <Input
              id={`${inputId}-cap`}
              value={block.caption ?? ""}
              placeholder="사진 아래 표시할 문구"
              onChange={(e) =>
                onChange({ ...block, caption: e.target.value || undefined })
              }
            />
          </div>
          {block.src ? (
            <p className="font-mono text-xs break-all text-muted-foreground">
              {block.src}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

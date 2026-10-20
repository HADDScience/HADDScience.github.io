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
  Video,
} from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PostBlock } from "@/content/types"
import { cn } from "@/lib/utils"
import { parseYouTube, youtubeEmbedSrc, youtubeWatchUrl } from "@/lib/youtube"

/**
 * 본문 블록 편집기.
 *
 * Tiptap · BlockNote 같은 리치 에디터를 얹지 않은 이유: 저 도구들은 자체 테마
 * 체계를 갖고 있어 우리 디자인시스템의 토큰·라디우스·버튼 규격을 그대로 입히기
 * 어렵고, 결과물도 HTML 문자열이라 언어별 번역·이미지 분리가 까다로워진다.
 * 우리 블록은 몇 종류뿐이라 직접 만드는 편이 작고 정확하다.
 */

const BLOCK_LABEL: Record<PostBlock["type"], string> = {
  heading: "소제목",
  text: "본문",
  quote: "인용",
  image: "이미지",
  links: "링크 목록",
  video: "영상",
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
  /** 사진 캡션을 「출처(필수)」로 받는다. 칼럼은 본문 사진에 출처를 단다(10/13 회의). */
  captionIsSource?: boolean
}

export function BlockEditor({
  blocks,
  onChange,
  onPickImage,
  resolveSrc,
  captionIsSource,
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
            : type === "video"
              ? { type: "video", provider: "youtube", id: "" }
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
              captionIsSource={captionIsSource}
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
          ) : block.type === "video" ? (
            <VideoBlockFields block={block} onChange={(next) => update(i, next)} />
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
        <AddButton
          onClick={() => add("video")}
          icon={<Video className="size-4" />}
        >
          영상
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
  captionIsSource,
}: {
  captionIsSource?: boolean
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
            <Label htmlFor={`${inputId}-cap`}>
              {captionIsSource ? "출처 (필수)" : "캡션 (선택)"}
            </Label>
            <Input
              id={`${inputId}-cap`}
              value={block.caption ?? ""}
              placeholder={
                captionIsSource
                  ? "예: 사진 = 보건복지부 제공 · AI 생성 이미지"
                  : "사진 아래 표시할 문구"
              }
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

/** 355 → "5분 55초". 시작 칸 옆 안내에 쓴다. */
function clock(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return [h ? `${h}시간` : "", m ? `${m}분` : "", s || (!h && !m) ? `${s}초` : ""].filter(Boolean).join(" ")
}

/**
 * 영상 블록. 유튜브 주소를 붙여 넣으면 영상 ID 와 시작 위치(`?t=`)를 뽑아 블록에 넣는다 —
 * 저장되는 것은 주소가 아니라 ID 다. 주소 칸은 이 화면에만 있는 입력이다.
 */
function VideoBlockFields({
  block,
  onChange,
}: {
  block: Extract<PostBlock, { type: "video" }>
  onChange: (block: PostBlock) => void
}) {
  const [url, setUrl] = React.useState(() =>
    block.id ? youtubeWatchUrl(block.id, block.start) : ""
  )
  const [error, setError] = React.useState<string | null>(null)
  // 블록은 순번을 key 로 쓰므로 위·아래로 옮기면 이 칸에 다른 영상이 들어온다. 그때 주소 칸을 맞춘다.
  const [seenId, setSeenId] = React.useState(block.id)
  if (seenId !== block.id) {
    setSeenId(block.id)
    if (parseYouTube(url)?.id !== block.id) {
      setUrl(block.id ? youtubeWatchUrl(block.id, block.start) : "")
      setError(null)
    }
  }
  const inputId = React.useId()
  const src = youtubeEmbedSrc(block.id, block.start)

  function paste(value: string) {
    setUrl(value)
    if (!value.trim()) {
      setError(null)
      onChange({ ...block, id: "", start: undefined })
      return
    }
    const parsed = parseYouTube(value)
    if (!parsed) {
      setError("유튜브 주소를 읽지 못했습니다. youtu.be/… 나 youtube.com/watch?v=… 주소를 붙여 넣어 주세요.")
      return
    }
    setError(null)
    onChange({ ...block, id: parsed.id, start: parsed.start })
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[240px_1fr]">
        <div className="relative grid aspect-video place-items-center overflow-hidden rounded-[12px] border border-dashed border-border bg-muted text-sm text-muted-foreground">
          {src ? (
            <iframe
              key={src}
              src={src}
              title={block.title || "영상 미리보기"}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 size-full border-0"
            />
          ) : (
            <span className="grid justify-items-center gap-1">
              <Video className="size-5" />
              주소를 붙여 넣으세요
            </span>
          )}
        </div>

        <div className="grid content-start gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor={`${inputId}-url`}>유튜브 주소</Label>
            <Input
              id={`${inputId}-url`}
              value={url}
              inputMode="url"
              placeholder="https://youtu.be/… 또는 youtube.com/watch?v=…"
              onChange={(e) => paste(e.target.value)}
              aria-invalid={error ? true : undefined}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${inputId}-start`}>시작 위치 (초, 선택)</Label>
            <Input
              id={`${inputId}-start`}
              type="number"
              min={0}
              step={1}
              value={block.start ?? ""}
              placeholder="0"
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                onChange({ ...block, start: Number.isFinite(n) && n > 0 ? n : undefined })
              }}
            />
            {block.start ? (
              <p className="text-xs text-muted-foreground">{clock(block.start)}부터 재생합니다</p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${inputId}-title`}>설명 (선택)</Label>
            <Input
              id={`${inputId}-title`}
              value={block.title ?? ""}
              placeholder="영상 아래 표시할 짧은 설명 (화면 낭독기도 읽습니다)"
              onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            />
          </div>
          {block.id ? (
            <p className="font-mono text-xs break-all text-muted-foreground">
              영상 ID {block.id}
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

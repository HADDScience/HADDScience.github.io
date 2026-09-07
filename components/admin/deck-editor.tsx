"use client"

import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { CardFace, CardPreview } from "@/components/cardnews/card-face"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {
  Card,
  CardDeck,
  CardImage,
  CardImageRatio,
  Lang,
  Post,
  PostBlock,
  PostLocale,
} from "@/content/types"
import type { ApiConfig } from "@/lib/admin-config"
import { prepareImage } from "@/lib/admin-image"
import {
  emptyLocale,
  savePost,
  translateForDeck,
  translationTargets,
  type PendingUpload,
} from "@/lib/admin-posts"
import {
  CARD_KINDS,
  RATIO_OPTIONS,
  cardKind,
  cardOutputSrc,
  cardSourceSrc,
  cardText,
  cardTitle,
  deckImageSrcs,
  defaultRatio,
  kindLabel,
  newCard,
  newDeck,
  type CardKind,
} from "@/lib/cardnews"
import {
  canvasToBytes,
  downloadZip,
  rasterizeCard,
  resizeCanvas,
} from "@/lib/cardnews-export"
import { lintCard, type LayoutIssue } from "@/lib/cardnews-lint"
import { cn } from "@/lib/utils"

/**
 * 카드뉴스 편집기.
 *
 * 글 편집기(`post-editor.tsx`)와 같은 자리에서 열리지만 본문 블록 대신 덱을 다룬다.
 * 사용자는 카드 종류를 고르고 칸을 채울 뿐이고, 위치·색·서체는 템플릿이 정한다 —
 * 자유 캔버스를 주면 브랜드가 흐트러지고 편집기 자체가 큰 제품이 된다.
 *
 * 저장은 덱을 브라우저에서 1080×1080 으로 구워 이미지 블록으로 게시하고, 원본 덱은
 * `post.deck` 에 함께 남겨 다시 열어 고칠 수 있게 한다.
 *
 * 영문 카드는 사람이 만들지 않는다 — 관리 화면에서는 한 언어만 쓴다는 원칙이 카드뉴스에도
 * 같다. 원문을 구운 뒤 번역 API 로 영문 덱을 받아 한 번 더 굽고, 그 이미지를 `content.en`
 * 에 넣는다. 저장하는 덱은 원문 하나뿐이다 — 원문을 고치면 영문은 다시 번역되므로 영문
 * 덱을 남겨 두면 낡은 사본이 하나 더 생길 뿐이다.
 */

type Upload = { bytes: Uint8Array; previewUrl: string }
/** `translate` 는 영문 덱을 굽는 동안. `total === 0` 이면 아직 번역 API 를 기다리는 중이다. */
type Progress = { kind: "png" | "save" | "translate"; done: number; total: number }
/** 굽는 무대에 올릴 덱. `id` 는 덱이 바뀔 때 무대를 통째로 다시 세우기 위한 것. */
type Stage = { id: number; deck: CardDeck }

const PREVIEW_MAX = 540

function progressLabel(p: Progress): string {
  if (p.kind === "translate" && p.total === 0) return "영문 만드는 중"
  if (p.done < p.total) {
    return `${p.kind === "translate" ? "영문 카드 " : ""}렌더 중 ${p.done + 1}/${p.total}`
  }
  return p.kind === "png" ? "묶는 중" : "저장 중"
}

export function DeckEditor({
  cfg,
  post: initial,
  order: initialOrder,
  isNew,
  onDone,
  onCancel,
}: {
  cfg: ApiConfig
  post: Post
  order: string[]
  isNew: boolean
  onDone: (post: Post, order: string[]) => void
  onCancel: () => void
}) {
  const [post, setPost] = React.useState<Post>(initial)
  const [deck, setDeck] = React.useState<CardDeck>(initial.deck ?? newDeck())
  const [selected, setSelected] = React.useState(0)
  const [progress, setProgress] = React.useState<Progress | null>(null)
  const [stage, setStage] = React.useState<Stage | null>(null)
  const [uploads, setUploads] = React.useState<Map<string, Upload>>(new Map())

  const objectUrls = React.useRef<string[]>([])
  React.useEffect(
    () => () => {
      for (const url of objectUrls.current) URL.revokeObjectURL(url)
      objectUrls.current = []
    },
    []
  )

  const lang = post.sourceLang
  const locale: PostLocale = post.content[lang] ?? emptyLocale()
  const thumbSrc = `/news/${post.id}/thumb.webp`

  function setLocale(next: PostLocale) {
    setPost((p) => ({ ...p, content: { ...p.content, [lang]: next } }))
  }

  const resolveSrc = React.useCallback(
    (src: string) => uploads.get(src)?.previewUrl ?? src,
    [uploads]
  )

  /* ------------------------------------------------------------ 카드 조작 */

  const card = deck.cards[selected]

  function updateCard(i: number, next: Card) {
    setDeck((d) => ({ ...d, cards: d.cards.map((c, j) => (j === i ? next : c)) }))
  }

  function moveCard(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= deck.cards.length) return
    setDeck((d) => {
      const cards = [...d.cards]
      ;[cards[i], cards[j]] = [cards[j], cards[i]]
      return { ...d, cards }
    })
    setSelected(j)
  }

  function removeCard(i: number) {
    if (deck.cards.length === 1) {
      toast.error("카드는 한 장 이상 있어야 합니다")
      return
    }
    setDeck((d) => ({ ...d, cards: d.cards.filter((_, j) => j !== i) }))
    setSelected((s) => Math.max(0, Math.min(s > i ? s - 1 : s, deck.cards.length - 2)))
  }

  function addCard(kind: CardKind) {
    const chapters = deck.cards.filter((c) => c.type === "chapter").length
    const created = newCard(kind, chapters + 1)
    setDeck((d) => ({ ...d, cards: [...d.cards, created] }))
    setSelected(deck.cards.length)
  }

  /* ------------------------------------------------------------ 사진 */

  async function pickImage(file: File): Promise<string> {
    const prepared = await prepareImage(file)
    const used = new Set(deckImageSrcs(deck))
    for (const key of uploads.keys()) used.add(key)
    let n = 1
    while (used.has(cardSourceSrc(post.id, n))) n++
    const src = cardSourceSrc(post.id, n)
    objectUrls.current.push(prepared.previewUrl)
    setUploads((prev) => {
      const next = new Map(prev)
      next.set(src, { bytes: prepared.bytes, previewUrl: prepared.previewUrl })
      return next
    })
    return src
  }

  async function pickThumbnail(file: File | undefined) {
    if (!file) return
    const prepared = await prepareImage(file)
    objectUrls.current.push(prepared.previewUrl)
    setUploads((prev) => {
      const next = new Map(prev)
      const old = next.get(thumbSrc)
      if (old) URL.revokeObjectURL(old.previewUrl)
      next.set(thumbSrc, { bytes: prepared.bytes, previewUrl: prepared.previewUrl })
      return next
    })
    setPost((p) => ({ ...p, thumbnail: thumbSrc }))
  }

  function clearThumbnail() {
    setUploads((prev) => {
      const next = new Map(prev)
      const old = next.get(thumbSrc)
      if (old) URL.revokeObjectURL(old.previewUrl)
      next.delete(thumbSrc)
      return next
    })
    setPost((p) => ({ ...p, thumbnail: "" }))
  }

  /* ------------------------------------------------------------ 렌더 */

  const stageSeq = React.useRef(0)
  const stageReady = React.useRef<((nodes: HTMLDivElement[]) => void) | null>(null)
  const onStageReady = React.useCallback((nodes: HTMLDivElement[]) => {
    stageReady.current?.(nodes)
    stageReady.current = null
  }, [])

  /**
   * 덱 하나를 화면 밖에 원본 크기로 그려 한 장씩 캔버스로 굽는다.
   * 미리보기는 축소된 상태라 그대로 찍을 수 없어 따로 무대를 세운다.
   *
   * 굽는 덱을 인자로 받는 이유는 저장할 때 원문과 번역본을 잇달아 굽기 때문이다.
   * 무대는 `id` 를 key 로 삼아 통째로 다시 세운다 — 카드 수가 같으면 React 가 DOM 을
   * 재사용해 새 덱의 노드를 못 받는다.
   */
  async function renderAll(
    target: CardDeck,
    kind: Progress["kind"]
  ): Promise<HTMLCanvasElement[]> {
    const total = target.cards.length
    setProgress({ kind, done: 0, total })
    const nodes = await new Promise<HTMLDivElement[]>((resolve) => {
      stageReady.current = resolve
      setStage({ id: ++stageSeq.current, deck: target })
    })
    const out: HTMLCanvasElement[] = []
    for (let i = 0; i < total; i++) {
      const node = nodes[i]
      if (!node) throw new Error(`${i + 1}번 카드를 그리지 못했습니다`)
      out.push(await rasterizeCard(node))
      setProgress({ kind, done: i + 1, total })
    }
    return out
  }

  /** 구운 캔버스를 업로드 목록과 이미지 블록으로 바꾼다. `lang` 은 원문이면 비운다. */
  async function bake(
    canvases: HTMLCanvasElement[],
    target: CardDeck,
    lang?: Lang
  ): Promise<{ outputs: PendingUpload[]; blocks: PostBlock[] }> {
    const outputs: PendingUpload[] = []
    const blocks: PostBlock[] = []
    for (let i = 0; i < canvases.length; i++) {
      const src = cardOutputSrc(post.id, i + 1, lang)
      outputs.push({ src, bytes: await canvasToBytes(canvases[i], "image/webp", 0.9) })
      blocks.push({ type: "image", src, alt: cardText(target.cards[i], target) })
    }
    return { outputs, blocks }
  }

  async function downloadPng() {
    if (progress) return
    try {
      const canvases = await renderAll(deck, "png")
      const files = await Promise.all(
        canvases.map(async (c, i) => ({
          name: `${post.id}-${String(i + 1).padStart(2, "0")}.png`,
          bytes: await canvasToBytes(c, "image/png"),
        }))
      )
      downloadZip(files, `${post.id}-cardnews.zip`)
      toast.success(`PNG ${files.length}장을 내려받았습니다`)
    } catch (err) {
      toast.error("PNG 를 만들지 못했습니다", {
        description: err instanceof Error ? err.message : "Chrome 에서 다시 시도해 주세요",
      })
    } finally {
      setProgress(null)
      setStage(null)
    }
  }

  async function save() {
    if (progress) return
    if (!locale.title.trim()) {
      toast.error("제목을 입력해 주세요")
      return
    }
    if (deck.cards.length === 0) {
      toast.error("카드를 한 장 이상 넣어 주세요")
      return
    }

    try {
      const canvases = await renderAll(deck, "save")
      const source = await bake(canvases, deck)
      const outputs: PendingUpload[] = [...source.outputs]
      const content: Post["content"] = {
        ...post.content,
        [lang]: { ...locale, blocks: source.blocks },
      }

      /* 영문 카드. 번역이 실패해도 원문 저장은 막지 않는다 — 사람이 쓴 글을 잃는 것이
         번역이 하루 늦는 것보다 훨씬 비싸다. 다시 저장하면 다시 시도한다. */
      let translationFailed = false
      for (const to of translationTargets(lang)) {
        try {
          setProgress({ kind: "translate", done: 0, total: 0 })
          const t = await translateForDeck(cfg, { from: lang, to, locale, deck })
          const enCanvases = await renderAll(t.deck, "translate")
          const en = await bake(enCanvases, t.deck, to)
          outputs.push(...en.outputs)
          content[to] = {
            title: t.locale.title,
            summary: t.locale.summary,
            blocks: en.blocks,
            // 서버가 준 원문 해시를 그대로 둔다. 저장할 때 같은 원문을 다시 번역하지 않는다.
            ...(t.locale.translatedFrom ? { translatedFrom: t.locale.translatedFrom } : {}),
          }
        } catch {
          translationFailed = true
        }
      }
      setProgress({ kind: "save", done: canvases.length, total: canvases.length })

      // 대표 이미지: 직접 고른 것이 있으면 그것, 없으면 첫 카드.
      const pickedThumb = uploads.get(thumbSrc)
      const thumbBytes = pickedThumb
        ? pickedThumb.bytes
        : await canvasToBytes(resizeCanvas(canvases[0], 640), "image/webp", 0.85)
      outputs.push({ src: thumbSrc, bytes: thumbBytes })

      // 덱이 실제로 참조하는 원본 사진만 올린다. 골랐다가 지운 사진은 버린다.
      const used = new Set(deckImageSrcs(deck))
      const sources: PendingUpload[] = [...uploads.entries()]
        .filter(([src]) => used.has(src))
        .map(([src, u]) => ({ src, bytes: u.bytes }))

      // 다시 저장하면 카드 이미지는 새 이름으로 다시 올라간다. 옛 카드 파일은 NAS 에 남는데,
      // 그 정리는 Omnis 쪽 정리 작업의 몫이다 — 여기서는 어떤 파일이 있는지 알 수 없다.
      // `deck` 은 원문만 저장한다. 번역 덱은 원문에서 언제든 다시 만들 수 있다.
      const next: Post = { ...post, thumbnail: thumbSrc, deck, content }
      const order = isNew ? [post.id, ...initialOrder] : initialOrder
      const result = await savePost(cfg, { post: next, uploads: [...sources, ...outputs] })
      if (translationFailed) {
        toast.warning("영문 카드는 만들지 못했습니다 — 다시 저장하면 다시 시도합니다")
      } else if (result.translationFailures.length) {
        toast.warning("저장했지만 제목·요약 번역은 실패했습니다", {
          description: `${result.translationFailures.join(" · ")} — 다시 저장하면 다시 시도합니다.`,
        })
      } else {
        toast.success("저장했습니다", { description: "사이트에 곧 반영됩니다." })
      }
      for (const u of uploads.values()) URL.revokeObjectURL(u.previewUrl)
      setUploads(new Map())
      onDone(result.post, order)
    } catch (err) {
      toast.error("저장하지 못했습니다", {
        description: err instanceof Error ? err.message : "잠시 뒤 다시 시도해 주세요",
      })
    } finally {
      setProgress(null)
      setStage(null)
    }
  }

  const busy = progress !== null

  return (
    <div className="grid gap-6">
      {/* 상단 바 */}
      <div className="sticky top-0 z-10 -mx-6 flex flex-wrap items-center gap-3 border-b border-border bg-background/88 px-6 py-4 backdrop-blur-md">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          <ArrowLeft className="size-4" />
          목록
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {locale.title || "제목 없는 카드뉴스"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {post.id} · 카드뉴스 {deck.cards.length}장
          </p>
        </div>
        {progress ? (
          <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {progressLabel(progress)}
          </span>
        ) : null}
        <Button variant="outline" size="sm" onClick={() => void downloadPng()} disabled={busy}>
          <Download className="size-4" />
          PNG 내려받기
        </Button>
        <Button size="sm" onClick={() => void save()} disabled={busy}>
          {progress?.kind === "save" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          저장하고 반영
        </Button>
      </div>

      <p className="-mt-3 text-xs text-muted-foreground">
        영문은 저장할 때 자동으로 만들어집니다 — 한국어만 채우시면 됩니다.
      </p>

      {/* 메타 */}
      <section className="grid gap-4 rounded-lg border border-border bg-card p-6 sm:grid-cols-[200px_1fr]">
        <div className="grid gap-2">
          <Label htmlFor="deck-thumb">대표 이미지</Label>
          <label
            htmlFor="deck-thumb"
            className="relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-[12px] border border-dashed border-border bg-muted text-center text-xs text-muted-foreground hover:border-brand-blue-500"
          >
            {uploads.has(thumbSrc) ? (
              /* eslint-disable-next-line @next/next/no-img-element -- blob: 미리보기 */
              <img
                src={resolveSrc(thumbSrc)}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            ) : deck.cards[0] ? (
              <CardPreview
                card={deck.cards[0]}
                deck={deck}
                resolveSrc={resolveSrc}
                width={200}
                className="absolute inset-0"
              />
            ) : (
              "첫 카드가 자동으로 쓰입니다"
            )}
          </label>
          <input
            id="deck-thumb"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              void pickThumbnail(e.target.files?.[0])
              e.target.value = ""
            }}
          />
          {uploads.has(thumbSrc) ? (
            <Button variant="ghost" size="sm" onClick={clearThumbnail}>
              <X className="size-4" />
              첫 카드로 되돌리기
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              비워 두면 첫 카드가 목록에 쓰입니다. 다른 사진을 쓰려면 클릭.
            </p>
          )}
        </div>

        <div className="grid content-start gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="deck-title">제목</Label>
            <Input
              id="deck-title"
              value={locale.title}
              placeholder="뉴스 목록과 기사 페이지에 보이는 제목"
              onChange={(e) => setLocale({ ...locale, title: e.target.value })}
              className="text-lg font-semibold"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="deck-summary">요약</Label>
            <Textarea
              id="deck-summary"
              rows={2}
              value={locale.summary}
              placeholder="목록 카드와 검색 결과에 나오는 한두 문장"
              onChange={(e) => setLocale({ ...locale, summary: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[192px_1fr]">
            <div className="grid gap-1.5">
              <Label htmlFor="deck-date">날짜</Label>
              <Input
                id="deck-date"
                value={post.date}
                placeholder="2026.08.27"
                onChange={(e) => setPost((p) => ({ ...p, date: e.target.value }))}
                className="font-mono"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="deck-external">원문 링크 (선택)</Label>
              <Input
                id="deck-external"
                value={post.externalHref ?? ""}
                placeholder="https://..."
                onChange={(e) =>
                  setPost((p) => ({ ...p, externalHref: e.target.value.trim() || null }))
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* 카드 목록 · 폼 · 미리보기 */}
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)]">
        <CardList
          deck={deck}
          selected={selected}
          resolveSrc={resolveSrc}
          onSelect={setSelected}
          onMove={moveCard}
          onRemove={removeCard}
          onAdd={addCard}
        />

        {card ? (
          <CardForm
            key={selected}
            card={card}
            deck={deck}
            onChange={(next) => updateCard(selected, next)}
            onDeckChange={setDeck}
            onPickImage={pickImage}
            resolveSrc={resolveSrc}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
            카드를 추가해 주세요.
          </div>
        )}

        {card ? (
          <div className="lg:col-span-2 xl:col-span-1">
            <Preview
              card={card}
              deck={deck}
              resolveSrc={resolveSrc}
              index={selected}
              total={deck.cards.length}
            />
          </div>
        ) : null}
      </div>

      {stage ? (
        <ExportStage
          key={stage.id}
          deck={stage.deck}
          resolveSrc={resolveSrc}
          onReady={onStageReady}
        />
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------- 카드 목록 */

function CardList({
  deck,
  selected,
  resolveSrc,
  onSelect,
  onMove,
  onRemove,
  onAdd,
}: {
  deck: CardDeck
  selected: number
  resolveSrc: (src: string) => string
  onSelect: (i: number) => void
  onMove: (i: number, dir: -1 | 1) => void
  onRemove: (i: number) => void
  onAdd: (kind: CardKind) => void
}) {
  const [adding, setAdding] = React.useState(false)
  return (
    <div className="grid content-start gap-3">
      <p className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        카드 {deck.cards.length}장
      </p>
      <ol className="grid gap-2">
        {deck.cards.map((c, i) => (
          <li
            key={i}
            className={cn(
              "grid gap-2 rounded-lg border bg-card p-2 transition-colors duration-120 ease-[var(--ease-standard)]",
              i === selected ? "border-brand-blue-700" : "border-border hover:border-brand-blue-500"
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(i)}
              className="grid grid-cols-[56px_1fr] items-center gap-2 text-left"
            >
              <span className="overflow-hidden rounded-[8px] bg-muted">
                <CardPreview card={c} deck={deck} resolveSrc={resolveSrc} width={56} placeholders />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{cardTitle(c)}</span>
                <span className="block font-mono text-[10px] text-muted-foreground">
                  {i + 1} · {kindLabel(cardKind(c))}
                </span>
              </span>
            </button>
            <div className="flex items-center justify-end gap-0.5">
              <IconButton label="위로" disabled={i === 0} onClick={() => onMove(i, -1)}>
                <ChevronUp className="size-4" />
              </IconButton>
              <IconButton
                label="아래로"
                disabled={i === deck.cards.length - 1}
                onClick={() => onMove(i, 1)}
              >
                <ChevronDown className="size-4" />
              </IconButton>
              <IconButton label="삭제" destructive onClick={() => onRemove(i)}>
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          </li>
        ))}
      </ol>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setAdding((v) => !v)}
      >
        {adding ? <X className="size-4" /> : <Plus className="size-4" />}
        카드 추가
      </Button>
      {adding ? (
        <ul className="grid gap-1 rounded-lg border border-border bg-card p-2">
          {CARD_KINDS.map((k) => (
            <li key={k.kind}>
              <button
                type="button"
                onClick={() => {
                  onAdd(k.kind)
                  setAdding(false)
                }}
                className="grid w-full rounded-[10px] px-2 py-1.5 text-left hover:bg-muted"
              >
                <span className="text-sm font-semibold">{k.label}</span>
                <span className="text-xs text-muted-foreground">{k.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------- 카드 폼 */

/** 레이아웃을 바꿀 때 양쪽에 다 있는 칸만 옮긴다. 없는 칸은 기본값으로 시작한다. */
function convertCard(card: Card, kind: CardKind, chapterIndex: number): Card {
  const fresh = newCard(kind, chapterIndex) as unknown as Record<string, unknown>
  const from = card as unknown as Record<string, unknown>
  for (const key of ["badge", "headline", "subtitle", "body", "footnote", "image"]) {
    if (key in fresh && from[key] !== undefined) fresh[key] = from[key]
  }
  if (card.type === "quote" && "headline" in fresh && !from.headline) fresh.headline = card.quote
  if (fresh.type === "quote" && "headline" in from) fresh.quote = from.headline
  return fresh as unknown as Card
}

function CardForm({
  card,
  deck,
  onChange,
  onDeckChange,
  onPickImage,
  resolveSrc,
}: {
  card: Card
  deck: CardDeck
  onChange: (card: Card) => void
  onDeckChange: (deck: CardDeck) => void
  onPickImage: (file: File) => Promise<string>
  resolveSrc: (src: string) => string
}) {
  const kind = cardKind(card)
  // 이 카드 앞에 있는 chapter 수 + 1. 다른 종류에서 chapter 로 바꿀 때 배지 번호가 된다.
  const position = deck.cards.indexOf(card)
  const chapterIndex =
    deck.cards.slice(0, position).filter((c) => c.type === "chapter").length + 1
  const patch = (p: Record<string, unknown>) =>
    onChange({ ...(card as unknown as Record<string, unknown>), ...p } as unknown as Card)

  return (
    <div className="grid content-start gap-4 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-1.5">
        <Label htmlFor="card-kind">카드 종류</Label>
        <NativeSelect
          id="card-kind"
          value={kind}
          onChange={(v) => onChange(convertCard(card, v as CardKind, chapterIndex))}
          options={CARD_KINDS.map((k) => ({ value: k.kind, label: `${k.label} — ${k.hint}` }))}
        />
      </div>

      {card.type === "cover" ? (
        <>
          <TextField label="제목" value={card.title} onChange={(v) => patch({ title: v })} />
          <TextField label="버튼 문구" value={card.cta} onChange={(v) => patch({ cta: v })} />
          <TextField
            label="핸들"
            value={deck.handle}
            placeholder="@haddscience"
            onChange={(v) => onDeckChange({ ...deck, handle: v })}
          />
        </>
      ) : card.type === "quote" ? (
        <>
          <TextField label="배지" value={card.badge} onChange={(v) => patch({ badge: v })} />
          <AreaField
            label="인용문"
            value={card.quote}
            rows={3}
            placeholder="“큰따옴표와 함께”"
            onChange={(v) => patch({ quote: v })}
          />
          <TextField label="이름 · 직함" value={card.attrib} onChange={(v) => patch({ attrib: v })} />
          <ImageField
            image={card.image}
            fallbackRatio={defaultRatio(card)}
            onChange={(image) => patch({ image })}
            onPickImage={onPickImage}
            resolveSrc={resolveSrc}
          />
        </>
      ) : (
        <>
          <TextField
            label="배지"
            value={card.badge}
            placeholder="chapter 01"
            onChange={(v) => patch({ badge: v })}
          />
          <AreaField
            label="제목"
            value={card.headline}
            rows={2}
            placeholder="🎤 내용을 상징하는 이모지 하나를 붙이면 좋습니다"
            onChange={(v) => patch({ headline: v })}
          />
          {card.layout === "standard" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="card-hsize">제목 크기</Label>
              <NativeSelect
                id="card-hsize"
                value={card.headlineSize ?? ""}
                onChange={(v) => patch({ headlineSize: v || undefined })}
                options={[
                  { value: "sm", label: "작게" },
                  { value: "", label: "기본" },
                  { value: "lg", label: "크게" },
                ]}
              />
            </div>
          ) : null}
          {card.layout === "standard" ||
          card.layout === "image-top" ||
          card.layout === "split" ? (
            <TextField
              label="부제 (선택)"
              value={card.subtitle ?? ""}
              onChange={(v) => patch({ subtitle: v || undefined })}
            />
          ) : null}

          {card.layout === "standard" || card.layout === "image-top" ? (
            <ImageField
              image={card.image}
              fallbackRatio={defaultRatio(card)}
              showRatio
              onChange={(image) => patch({ image })}
              onPickImage={onPickImage}
              resolveSrc={resolveSrc}
            />
          ) : card.layout === "split" ? (
            <ImageField
              image={card.image}
              fallbackRatio={defaultRatio(card)}
              onChange={(image) => patch({ image })}
              onPickImage={onPickImage}
              resolveSrc={resolveSrc}
              extra={
                <div className="grid gap-1.5">
                  <Label htmlFor="card-fit">사진 맞춤</Label>
                  <NativeSelect
                    id="card-fit"
                    value={card.imageFit ?? "cover"}
                    onChange={(v) => patch({ imageFit: v === "contain" ? "contain" : undefined })}
                    options={[
                      { value: "cover", label: "칸을 꽉 채움 (인물 사진)" },
                      { value: "contain", label: "자르지 않음 (상장·공문)" },
                    ]}
                  />
                </div>
              }
            />
          ) : card.layout === "overlay" ? (
            <ImageField
              image={card.image}
              fallbackRatio={defaultRatio(card)}
              onChange={(image) => patch({ image })}
              onPickImage={onPickImage}
              resolveSrc={resolveSrc}
            />
          ) : null}

          {card.layout === "stat" ? (
            <StatFields stats={card.stats} onChange={(stats) => patch({ stats })} />
          ) : null}

          {card.layout === "list" ? (
            <ListFields
              marker={card.marker}
              items={card.items}
              onChange={(p) => patch(p)}
            />
          ) : null}

          {card.layout !== "list" ? (
            <AreaField
              label={card.layout === "stat" ? "부연 설명 (선택)" : "본문"}
              value={card.body ?? ""}
              rows={5}
              placeholder="줄바꿈은 그대로 반영됩니다."
              onChange={(v) => patch({ body: v })}
            />
          ) : null}

          {card.layout !== "stat" && card.layout !== "list" ? (
            <TextField
              label="각주 (선택)"
              value={card.footnote ?? ""}
              placeholder="👇 강조 한 줄"
              onChange={(v) => patch({ footnote: v || undefined })}
            />
          ) : null}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        줄바꿈은 그대로 반영됩니다. 파란 볼드 강조는 <code>&lt;b&gt;이렇게&lt;/b&gt;</code>{" "}
        감싸 주세요.
      </p>
    </div>
  )
}

function StatFields({
  stats,
  onChange,
}: {
  stats: { value: string; unit?: string; label: string }[]
  onChange: (stats: { value: string; unit?: string; label: string }[]) => void
}) {
  const update = (i: number, p: Partial<(typeof stats)[number]>) =>
    onChange(stats.map((s, j) => (j === i ? { ...s, ...p } : s)))
  return (
    <div className="grid gap-2">
      <Label>지표 (최대 3개)</Label>
      {stats.map((s, i) => (
        <div key={i} className="grid grid-cols-[1fr_72px_1fr_32px] items-center gap-2">
          <Input value={s.value} placeholder="17" onChange={(e) => update(i, { value: e.target.value })} />
          <Input value={s.unit ?? ""} placeholder="년" onChange={(e) => update(i, { unit: e.target.value || undefined })} />
          <Input value={s.label} placeholder="연구" onChange={(e) => update(i, { label: e.target.value })} />
          <IconButton
            label="삭제"
            destructive
            disabled={stats.length === 1}
            onClick={() => onChange(stats.filter((_, j) => j !== i))}
          >
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      ))}
      {stats.length < 3 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          onClick={() => onChange([...stats, { value: "", unit: "", label: "" }])}
        >
          <Plus className="size-4" />
          지표 추가
        </Button>
      ) : null}
    </div>
  )
}

function ListFields({
  marker,
  items,
  onChange,
}: {
  marker: "number" | "bullet" | "emoji"
  items: { title: string; desc?: string; emoji?: string }[]
  onChange: (p: { marker?: "number" | "bullet" | "emoji"; items?: typeof items }) => void
}) {
  const update = (i: number, p: Partial<(typeof items)[number]>) =>
    onChange({ items: items.map((it, j) => (j === i ? { ...it, ...p } : it)) })
  return (
    <div className="grid gap-2">
      <div className="grid gap-1.5">
        <Label htmlFor="card-marker">표시</Label>
        <NativeSelect
          id="card-marker"
          value={marker}
          onChange={(v) => onChange({ marker: v as "number" | "bullet" | "emoji" })}
          options={[
            { value: "number", label: "번호" },
            { value: "bullet", label: "불릿" },
            { value: "emoji", label: "이모지" },
          ]}
        />
      </div>
      <Label>항목</Label>
      {items.map((it, i) => (
        <div
          key={i}
          className={cn(
            "grid items-start gap-2",
            marker === "emoji" ? "grid-cols-[56px_1fr_32px]" : "grid-cols-[1fr_32px]"
          )}
        >
          {marker === "emoji" ? (
            <Input
              value={it.emoji ?? ""}
              placeholder="✅"
              onChange={(e) => update(i, { emoji: e.target.value || undefined })}
            />
          ) : null}
          <div className="grid gap-1.5">
            <Input value={it.title} placeholder="항목 제목" onChange={(e) => update(i, { title: e.target.value })} />
            <Input
              value={it.desc ?? ""}
              placeholder="설명 (선택)"
              onChange={(e) => update(i, { desc: e.target.value || undefined })}
            />
          </div>
          <IconButton
            label="삭제"
            destructive
            disabled={items.length === 1}
            onClick={() => onChange({ items: items.filter((_, j) => j !== i) })}
          >
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-self-start"
        onClick={() => onChange({ items: [...items, { title: "", desc: "" }] })}
      >
        <Plus className="size-4" />
        항목 추가
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------- 사진 칸 */

const POS_OPTIONS = [
  { value: "center", label: "가운데" },
  { value: "top", label: "위쪽" },
  { value: "bottom", label: "아래쪽" },
  { value: "left", label: "왼쪽" },
  { value: "right", label: "오른쪽" },
]

function ImageField({
  image,
  fallbackRatio,
  showRatio,
  extra,
  onChange,
  onPickImage,
  resolveSrc,
}: {
  image: CardImage | undefined
  fallbackRatio: CardImageRatio
  showRatio?: boolean
  extra?: React.ReactNode
  onChange: (image: CardImage | undefined) => void
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
      onChange({ ...(image ?? {}), src })
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진을 넣지 못했습니다")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-3">
      <Label htmlFor={inputId}>사진</Label>
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <label
          htmlFor={inputId}
          className="relative grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-[12px] border border-dashed border-border bg-muted text-sm text-muted-foreground hover:border-brand-blue-500"
        >
          {image?.src ? (
            /* eslint-disable-next-line @next/next/no-img-element -- 아직 저장소에 올라가지 않은 blob: URL */
            <img
              src={resolveSrc(image.src)}
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
          {showRatio ? (
            <div className="grid gap-1.5">
              <Label htmlFor={`${inputId}-ratio`}>비율</Label>
              <NativeSelect
                id={`${inputId}-ratio`}
                value={image?.ratio ?? fallbackRatio}
                onChange={(v) =>
                  onChange({ ...(image ?? { src: "" }), ratio: v as CardImageRatio })
                }
                options={RATIO_OPTIONS.map((r) => ({
                  value: r.value,
                  label: r.value === fallbackRatio ? `${r.label} · 기본` : r.label,
                }))}
              />
            </div>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor={`${inputId}-pos`}>초점</Label>
            <NativeSelect
              id={`${inputId}-pos`}
              value={image?.pos ?? "center"}
              onChange={(v) =>
                onChange({ ...(image ?? { src: "" }), pos: v === "center" ? undefined : v })
              }
              options={POS_OPTIONS}
            />
          </div>
          {extra}
          {image?.src ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="justify-self-start"
              onClick={() => onChange(undefined)}
            >
              <X className="size-4" />
              사진 빼기
            </Button>
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

/* ------------------------------------------------------------- 미리보기 */

function Preview({
  card,
  deck,
  resolveSrc,
  index,
  total,
}: {
  card: Card
  deck: CardDeck
  resolveSrc: (src: string) => string
  index: number
  total: number
}) {
  const box = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(PREVIEW_MAX)
  const [issues, setIssues] = React.useState<LayoutIssue[]>([])

  React.useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.min(PREVIEW_MAX, Math.floor(entry.contentRect.width)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* 내용이 카드 밖으로 흘러넘치거나, 마지막 줄에 글자 한두 개만 떨어지면 결과물이 못나다.
     실제로 그려진 줄을 읽어야 알 수 있으므로 렌더 뒤에 검사한다(lib/cardnews-lint.ts). */
  React.useEffect(() => {
    const el = box.current
    if (!el) return
    let raf = 0
    const check = () => {
      const root = el.querySelector<HTMLElement>(".cn-root")
      setIssues(root ? lintCard(root) : [])
    }
    raf = requestAnimationFrame(check)
    const ro = new ResizeObserver(check)
    const inner = el.querySelector<HTMLElement>(".cn-root .card")
    if (inner) ro.observe(inner)
    void document.fonts.ready.then(check)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [card, deck, width])

  return (
    <div className="lg:sticky lg:top-24">
      <p className="mb-3 font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        미리보기 — {index + 1} / {total}
      </p>
      <div ref={box} className="grid gap-3">
        <div className="overflow-hidden rounded-lg border border-border">
          <CardPreview card={card} deck={deck} resolveSrc={resolveSrc} width={width} placeholders />
        </div>
        {issues.map((issue, i) => (
          <p
            key={i}
            role="alert"
            className={cn(
              "flex items-start gap-2 rounded-lg p-3 text-sm",
              issue.kind === "overflow"
                ? "bg-destructive/8 text-destructive"
                : "bg-brand-orange-500/10 text-brand-orange-600"
            )}
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {issue.message}
          </p>
        ))}
      </div>
    </div>
  )
}

/**
 * 내보내기 무대. 화면 밖에 덱 전체를 원본 크기로 그린다.
 * display:none 이나 visibility:hidden 은 레이아웃·이미지 로딩이 멈춰 찍을 수 없다.
 *
 * 그려진 노드는 `onReady` 로 올려 보낸다 — 부모가 ref 를 들고 있으면 덱이 바뀔 때
 * 어느 덱의 노드인지 헷갈린다. 무대는 덱마다 key 로 새로 세운다.
 */
function ExportStage({
  deck,
  resolveSrc,
  onReady,
}: {
  deck: CardDeck
  resolveSrc: (src: string) => string
  onReady: (nodes: HTMLDivElement[]) => void
}) {
  const nodes = React.useRef<(HTMLDivElement | null)[]>([])
  React.useEffect(() => {
    onReady(nodes.current.filter((n): n is HTMLDivElement => n !== null))
  }, [onReady, deck])
  return (
    <div aria-hidden style={{ position: "fixed", left: -20000, top: 0 }}>
      {deck.cards.map((c, i) => (
        <CardFace
          key={i}
          card={c}
          deck={deck}
          resolveSrc={resolveSrc}
          ref={(el) => {
            nodes.current[i] = el
          }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------- 프리미티브 */

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
}) {
  const id = React.useId()
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function AreaField({
  label,
  value,
  rows,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  rows: number
  placeholder?: string
  onChange: (v: string) => void
}) {
  const id = React.useId()
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

/** 네이티브 select. 옵션이 몇 개뿐이라 팝업 컴포넌트보다 이쪽이 단순하고 키보드에 잘 맞는다. */
function NativeSelect({
  id,
  value,
  onChange,
  options,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
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

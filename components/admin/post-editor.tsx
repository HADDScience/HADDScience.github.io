"use client"

import { ArrowLeft, Eye, Languages, Loader2, Save } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { BlockEditor } from "@/components/admin/block-editor"
import { PostBody } from "@/components/ds/post-body"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AVAILABLE_LANGS } from "@/content"
import type { Lang, Post, PostBlock, PostLocale } from "@/content/types"
import {
  emptyLocale,
  mediaSrc,
  savePost,
  toRepoPath,
  type PendingUpload,
} from "@/lib/admin-posts"
import { prepareImage } from "@/lib/admin-image"
import type { GhConfig } from "@/lib/github"
import { cn } from "@/lib/utils"

const LANG_LABEL: Record<Lang, string> = { ko: "한국어", en: "English" }

/**
 * 기사 편집기.
 *
 * 언어 탭이 편집기 전체를 감싼다. 텍스트는 자동 번역이 채우지만 이미지는 언어별로
 * 다를 수 있어(카드뉴스처럼 그림 안에 글자가 있는 경우) 한 화면에서 두 언어를 섞어
 * 보여주면 어느 쪽을 고치는지 헷갈린다.
 */
export function PostEditor({
  cfg,
  post: initial,
  order: initialOrder,
  isNew,
  onDone,
  onCancel,
}: {
  cfg: GhConfig
  post: Post
  order: string[]
  isNew: boolean
  onDone: (post: Post, order: string[]) => void
  onCancel: () => void
}) {
  const [post, setPost] = React.useState<Post>(initial)
  const [lang, setLang] = React.useState<Lang>(initial.sourceLang)
  const [saving, setSaving] = React.useState(false)
  const [showPreview, setShowPreview] = React.useState(true)

  /* 아직 커밋하지 않은 이미지. key 는 사이트 경로(`/news/...`). */
  const [uploads, setUploads] = React.useState<
    Map<string, { bytes: Uint8Array; previewUrl: string }>
  >(new Map())

  /* 만들어 둔 blob: URL 목록. 편집기를 벗어날 때 되돌려주지 않으면 탭이 살아 있는
     동안 메모리에 남는다. 상태를 ref 로 미러링하지 않고 만드는 쪽에서 바로 쌓는다. */
  const objectUrls = React.useRef<string[]>([])
  React.useEffect(
    () => () => {
      for (const url of objectUrls.current) URL.revokeObjectURL(url)
      objectUrls.current = []
    },
    []
  )

  const locale = post.content[lang]

  function setLocale(next: PostLocale) {
    /* 원문이 아닌 언어를 사람이 손대면 manual 을 켠다. 그래야 원문을 고쳤을 때
       CI 의 자동 번역이 이 번역을 덮어쓰지 않는다. */
    const marked: PostLocale =
      lang === post.sourceLang ? next : { ...next, manual: true }
    setPost((p) => ({ ...p, content: { ...p.content, [lang]: marked } }))
  }

  function resolveSrc(src: string) {
    return uploads.get(src)?.previewUrl ?? src
  }

  async function pickImage(file: File): Promise<string> {
    const prepared = await prepareImage(file)
    // 같은 언어 안에서 번호가 겹치지 않도록 이미 쓰인 번호 다음을 고른다.
    const used = new Set(
      Object.values(post.content)
        .flatMap((l) => l?.blocks ?? [])
        .filter((b): b is Extract<PostBlock, { type: "image" }> => b.type === "image")
        .map((b) => b.src)
    )
    for (const key of uploads.keys()) used.add(key)
    let n = 1
    while (used.has(mediaSrc(post.id, lang, n))) n++
    const src = mediaSrc(post.id, lang, n)
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
    const src = `/news/${post.id}/thumb.webp`
    objectUrls.current.push(prepared.previewUrl)
    setUploads((prev) => {
      const next = new Map(prev)
      const old = next.get(src)
      if (old) URL.revokeObjectURL(old.previewUrl)
      next.set(src, { bytes: prepared.bytes, previewUrl: prepared.previewUrl })
      return next
    })
    setPost((p) => ({ ...p, thumbnail: src }))
  }

  async function save() {
    const source = post.content[post.sourceLang]
    if (!source?.title.trim()) {
      toast.error("제목을 입력해 주세요")
      setLang(post.sourceLang)
      return
    }
    if (!post.thumbnail) {
      toast.error("목록에 쓸 대표 이미지를 골라 주세요")
      return
    }

    setSaving(true)
    const order = isNew ? [post.id, ...initialOrder] : initialOrder
    const pending: PendingUpload[] = [...uploads.entries()].map(
      ([src, u]) => ({ path: toRepoPath(src), bytes: u.bytes })
    )
    try {
      const commit = await savePost(cfg, {
        post,
        order,
        uploads: pending,
        message: `${isNew ? "기사 작성" : "기사 수정"}: ${source.title}`,
      })
      toast.success("저장했습니다", {
        description: "몇 분 뒤 사이트에 반영됩니다.",
        action: {
          label: "커밋 보기",
          onClick: () => window.open(commit.url, "_blank", "noopener"),
        },
      })
      for (const u of uploads.values()) URL.revokeObjectURL(u.previewUrl)
      setUploads(new Map())
      onDone(post, order)
    } catch (err) {
      toast.error("저장하지 못했습니다", {
        description:
          err instanceof Error
            ? err.message
            : "잠시 뒤 다시 시도해 주세요",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6">
      {/* 상단 바 */}
      <div className="sticky top-0 z-10 -mx-6 flex flex-wrap items-center gap-3 border-b border-border bg-background/88 px-6 py-4 backdrop-blur-md">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="size-4" />
          목록
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {post.content[post.sourceLang]?.title || "제목 없는 기사"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{post.id}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview((v) => !v)}
        >
          <Eye className="size-4" />
          {showPreview ? "미리보기 숨기기" : "미리보기"}
        </Button>
        <Button size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          저장하고 반영
        </Button>
      </div>

      {/* 메타 */}
      <section className="grid gap-4 rounded-lg border border-border bg-card p-6 sm:grid-cols-[200px_1fr]">
        <div className="grid gap-2">
          <Label htmlFor="thumb">대표 이미지</Label>
          <label
            htmlFor="thumb"
            className="relative grid aspect-[16/10] cursor-pointer place-items-center overflow-hidden rounded-[12px] border border-dashed border-border bg-muted text-xs text-muted-foreground hover:border-brand-blue-500"
          >
            {post.thumbnail ? (
              /* eslint-disable-next-line @next/next/no-img-element -- blob: 미리보기 */
              <img
                src={resolveSrc(post.thumbnail)}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              "목록 카드에 쓰입니다"
            )}
          </label>
          <input
            id="thumb"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              void pickThumbnail(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </div>

        <div className="grid content-start gap-4">
          <div className="grid gap-1.5 sm:max-w-48">
            <Label htmlFor="date">날짜</Label>
            <Input
              id="date"
              value={post.date}
              placeholder="2026.08.27"
              onChange={(e) => setPost((p) => ({ ...p, date: e.target.value }))}
              className="font-mono"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="external">원문 링크 (선택)</Label>
            <Input
              id="external"
              value={post.externalHref ?? ""}
              placeholder="https://..."
              onChange={(e) =>
                setPost((p) => ({
                  ...p,
                  externalHref: e.target.value.trim() || null,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              보도자료처럼 외부에 원문이 있는 글이면 넣어 주세요. 기사 아래에 출처
              링크로 붙습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 언어 탭 */}
      <div className="flex flex-wrap items-center gap-2">
        {AVAILABLE_LANGS.map((l) => {
          const has = Boolean(post.content[l]?.blocks.length)
          return (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={cn(
                "flex items-center gap-2 rounded-[12px] border px-4 py-2 text-sm font-semibold transition-colors duration-120 ease-[var(--ease-standard)]",
                lang === l
                  ? "border-brand-blue-700 bg-brand-blue-700 text-white"
                  : "border-border bg-card hover:border-brand-blue-500"
              )}
            >
              {LANG_LABEL[l]}
              {l === post.sourceLang ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    lang === l ? "bg-white/20" : "bg-muted"
                  )}
                >
                  원문
                </span>
              ) : !has ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    lang === l ? "bg-white/20" : "bg-muted"
                  )}
                >
                  번역 대기
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {!locale ? (
        <div className="grid justify-items-start gap-3 rounded-lg border border-dashed border-border bg-card p-8">
          <Languages className="size-5 text-muted-foreground" />
          <p className="font-semibold">{LANG_LABEL[lang]} 번역이 아직 없습니다</p>
          <p className="max-w-prose text-sm text-muted-foreground">
            원문을 저장하면 자동 번역이 이 언어의 본문을 채웁니다. 번역을 기다리지
            않고 직접 쓰려면 아래 버튼을 누르세요 — 직접 쓴 본문은 자동 번역이
            덮어쓰지 않습니다.
          </p>
          <Button variant="outline" onClick={() => setLocale(emptyLocale())}>
            직접 작성하기
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-6",
            showPreview && "lg:grid-cols-2 lg:items-start"
          )}
        >
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={locale.title}
                onChange={(e) => setLocale({ ...locale, title: e.target.value })}
                className="text-lg font-semibold"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="summary">요약</Label>
              <Textarea
                id="summary"
                rows={2}
                value={locale.summary}
                placeholder="목록 카드와 검색 결과에 나오는 한두 문장"
                onChange={(e) =>
                  setLocale({ ...locale, summary: e.target.value })
                }
              />
            </div>

            <BlockEditor
              blocks={locale.blocks}
              onChange={(blocks) => setLocale({ ...locale, blocks })}
              onPickImage={pickImage}
              resolveSrc={resolveSrc}
            />
          </div>

          {showPreview ? (
            <div className="lg:sticky lg:top-24">
              <p className="mb-3 font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                미리보기 — {LANG_LABEL[lang]}
              </p>
              <div className="max-h-[70svh] overflow-y-auto rounded-lg border border-border bg-background p-8">
                <time className="font-mono text-sm text-muted-foreground">
                  {post.date}
                </time>
                <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-balance">
                  {locale.title || "제목 없음"}
                </h1>
                {locale.summary ? (
                  <p className="mt-3 text-lg text-balance text-muted-foreground">
                    {locale.summary}
                  </p>
                ) : null}
                {/* 실제 기사 페이지와 같은 컴포넌트다 — 미리보기와 결과가 갈리지 않는다. */}
                <PostBody blocks={locale.blocks} resolveSrc={resolveSrc} />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

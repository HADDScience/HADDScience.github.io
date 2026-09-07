import { api } from "@/lib/admin-api"
import type { ApiConfig } from "@/lib/admin-config"
import type { Lang, Post, PostLocale } from "@/content/types"

/**
 * 관리자 페이지의 기사 저장소 계층 — Omnis API 위에 얹힌다.
 *
 * 편집기는 사진을 고를 때 `/news/<id>/…` 모양의 임시 경로를 만들어 미리보기(blob:)와
 * 짝지어 둔다. 저장할 때 그 사진들을 먼저 올리고, 돌아온 실제 URL 로 기사 JSON 안의
 * 임시 경로를 바꿔 넣은 뒤 기사를 PUT 한다. 편집기 화면은 이 치환을 모른다.
 */

interface PostDto extends Omit<Post, "thumbnail"> {
  position: number
  thumbnail: string | null
  updatedAt: string
}

function fromDto(dto: PostDto): Post {
  return {
    id: dto.id,
    date: dto.date,
    sourceLang: dto.sourceLang,
    thumbnail: dto.thumbnail ?? "",
    externalHref: dto.externalHref,
    content: dto.content,
    ...(dto.deck ? { deck: dto.deck } : {}),
  }
}

export interface PostIndex {
  /** 최신순. */
  order: string[]
  posts: Post[]
}

export async function loadPosts(cfg: ApiConfig): Promise<PostIndex> {
  const dtos = await api<PostDto[]>(cfg, "/posts")
  const posts = dtos.map(fromDto)
  return { order: posts.map((p) => p.id), posts }
}

/* ------------------------------------------------------------- 새 기사 */

export function emptyLocale(): PostLocale {
  return { title: "", summary: "", blocks: [] }
}

/**
 * 새 기사 id. 아임웹 시절 기사는 숫자 id 라 그 체계를 이어갈 수 없다. 날짜 기반으로
 * 만들어 목록만 봐도 언제 쓴 글인지 알 수 있게 한다.
 */
export function newPostId(now: Date): string {
  const p = (n: number, w = 2) => String(n).padStart(w, "0")
  return [
    now.getFullYear(),
    p(now.getMonth() + 1),
    p(now.getDate()),
    "-",
    p(now.getHours()),
    p(now.getMinutes()),
  ].join("")
}

export function formatDate(now: Date): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}.${p(now.getMonth() + 1)}.${p(now.getDate())}`
}

export function newPost(id: string, date: string, sourceLang: Lang): Post {
  return {
    id,
    date,
    sourceLang,
    thumbnail: "",
    externalHref: null,
    content: { [sourceLang]: emptyLocale() },
  }
}

/* --------------------------------------------------------------- 저장 */

/** 아직 올리지 않은 사진. `src` 는 편집기가 만든 임시 경로(`/news/<id>/…`). */
export interface PendingUpload {
  src: string
  bytes: Uint8Array
  contentType?: string
}

export function mediaSrc(postId: string, lang: Lang, index: number, ext = "webp") {
  return `/news/${postId}/${lang}-${String(index).padStart(2, "0")}.${ext}`
}

async function uploadMedia(cfg: ApiConfig, postId: string, u: PendingUpload): Promise<string> {
  const { url } = await api<{ url: string }>(cfg, "/media", {
    method: "POST",
    raw: u.bytes as unknown as BodyInit,
    headers: {
      "Content-Type": u.contentType ?? "image/webp",
      "X-Post-Id": postId,
    },
  })
  return url
}

/** JSON 안의 문자열을 표에 따라 바꾼다. 임시 사진 경로를 실제 URL 로. */
function replaceStrings<T>(value: T, map: Map<string, string>): T {
  if (typeof value === "string") return (map.get(value) ?? value) as T
  if (Array.isArray(value)) return value.map((v) => replaceStrings(v, map)) as T
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, replaceStrings(v, map)])
    ) as T
  }
  return value
}

export interface SaveOptions {
  post: Post
  uploads: PendingUpload[]
}

export interface SaveResult {
  post: Post
  /** 자동 번역이 실패한 언어. 원문은 저장됐다. */
  translationFailures: string[]
}

export async function savePost(cfg: ApiConfig, opts: SaveOptions): Promise<SaveResult> {
  // 사진을 먼저 올린다. 하나라도 실패하면 기사는 저장하지 않는다 — 깨진 사진 경로가 남지 않게.
  const urlOf = new Map<string, string>()
  for (const u of opts.uploads) urlOf.set(u.src, await uploadMedia(cfg, opts.post.id, u))

  const post = replaceStrings(opts.post, urlOf)
  const body = {
    date: post.date,
    sourceLang: post.sourceLang,
    thumbnail: post.thumbnail || null,
    externalHref: post.externalHref,
    content: post.content,
    deck: post.deck ?? null,
  }
  const result = await api<{ post: PostDto; translationFailures: string[] }>(
    cfg,
    `/posts/${post.id}`,
    { method: "PUT", body: JSON.stringify(body) }
  )
  return { post: fromDto(result.post), translationFailures: result.translationFailures }
}

export async function deletePost(cfg: ApiConfig, postId: string): Promise<void> {
  await api(cfg, `/posts/${postId}`, { method: "DELETE" })
}

import { AVAILABLE_LANGS } from "@/content"
import { api } from "@/lib/admin-api"
import type { ApiConfig } from "@/lib/admin-config"
import type { CardDeck, Lang, Post, PostLocale } from "@/content/types"

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

/* --------------------------------------------------------------- 번역 */

/** 원문 말고 콘텐츠가 준비된 언어들. 지금은 하나뿐이지만 늘어나도 그대로 돈다. */
export function translationTargets(sourceLang: Lang): Lang[] {
  return AVAILABLE_LANGS.filter((l) => l !== sourceLang)
}

export interface DeckTranslation {
  locale: PostLocale
  deck: CardDeck
}

/**
 * 카드뉴스 한 건을 다른 언어로 번역한다. 제목·요약과 덱의 글자를 함께 넘겨야
 * 카드 안의 문장과 목록 제목이 같은 어조로 나온다.
 *
 * `blocks` 는 빈 배열로 보낸다 — 본문은 카드 이미지라 번역할 글이 없고, 돌아온 덱을
 * 브라우저가 다시 구워 만든 이미지 블록이 그 자리를 채운다.
 * 응답의 `translatedFrom` 은 그대로 저장한다. 서버가 저장할 때 같은 원문을 다시
 * 번역하지 않게 하는 표식이다.
 */
export async function translateForDeck(
  cfg: ApiConfig,
  opts: { from: Lang; to: Lang; locale: PostLocale; deck: CardDeck }
): Promise<DeckTranslation> {
  return api<DeckTranslation>(cfg, "/translate", {
    method: "POST",
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      locale: { title: opts.locale.title, summary: opts.locale.summary, blocks: [] },
      deck: opts.deck,
    }),
  })
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

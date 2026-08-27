import {
  NEWS_DIR,
  NEWS_MEDIA_DIR,
} from "@/lib/admin-config"
import {
  commitFiles,
  encodeBase64,
  listDir,
  readBlob,
  type FileChange,
  type GhConfig,
} from "@/lib/github"
import type { Lang, Post, PostLocale } from "@/content/types"

/**
 * 관리자 페이지의 기사 저장소 계층.
 *
 * git 이 데이터베이스다. 기사 하나가 파일 하나이므로 "누가 언제 무엇을 고쳤는지" 는
 * 커밋 히스토리가 그대로 답한다. 되돌리기도 revert 로 끝난다.
 */

const CACHE_PREFIX = "hadd-admin-blob:"

function cacheGet(sha: string): string | null {
  try {
    return sessionStorage.getItem(CACHE_PREFIX + sha)
  } catch {
    return null
  }
}

function cacheSet(sha: string, text: string) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + sha, text)
  } catch {
    // 용량이 차면 캐시 없이 동작한다. 기능에는 영향이 없다.
  }
}

async function readCached(cfg: GhConfig, sha: string): Promise<string> {
  const hit = cacheGet(sha)
  if (hit !== null) return hit
  const text = await readBlob(cfg, sha)
  cacheSet(sha, text)
  return text
}

/** 동시 요청 수를 묶어 실행한다. 48개를 한꺼번에 던지면 브라우저가 큐에 쌓아 둔다. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      out[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return out
}

export interface PostIndex {
  /** 최신순. order.json 그대로다. */
  order: string[]
  posts: Post[]
}

export async function loadPosts(cfg: GhConfig): Promise<PostIndex> {
  const entries = await listDir(cfg, NEWS_DIR)
  const byName = new Map(entries.map((e) => [e.name, e]))

  const orderEntry = byName.get("order.json")
  if (!orderEntry) throw new Error(`${NEWS_DIR}/order.json 을 찾지 못했습니다`)
  const order = JSON.parse(await readCached(cfg, orderEntry.sha)) as string[]

  const posts = await mapLimit(order, 8, async (id) => {
    const entry = byName.get(`${id}.json`)
    if (!entry) throw new Error(`${id}.json 이 없습니다`)
    return JSON.parse(await readCached(cfg, entry.sha)) as Post
  })

  return { order, posts }
}

/* ------------------------------------------------------------- 새 기사 */

export function emptyLocale(): PostLocale {
  return { title: "", summary: "", blocks: [] }
}

/**
 * 새 기사 id.
 *
 * 기존 기사는 아임웹이 매긴 숫자 id 라 그 체계를 이어갈 수 없다. 날짜 기반으로
 * 만들어 파일 목록만 봐도 언제 쓴 글인지 알 수 있게 한다.
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

export interface PendingUpload {
  /** 저장소 기준 경로. `public/` 을 포함한다. */
  path: string
  bytes: Uint8Array
}

/** 사이트에서 참조하는 경로(`/news/...`)를 저장소 경로(`public/news/...`)로. */
export function toRepoPath(src: string): string {
  return `${NEWS_MEDIA_DIR}${src.replace(/^\/news/, "")}`
}

export function mediaSrc(postId: string, lang: Lang, index: number, ext = "webp") {
  return `/news/${postId}/${lang}-${String(index).padStart(2, "0")}.${ext}`
}

export interface SaveOptions {
  post: Post
  /** 목록 순서. 새 기사면 맨 앞에 넣은 배열을 넘긴다. */
  order: string[]
  uploads: PendingUpload[]
  message: string
}

export async function savePost(cfg: GhConfig, opts: SaveOptions) {
  const changes: FileChange[] = [
    {
      path: `${NEWS_DIR}/${opts.post.id}.json`,
      text: JSON.stringify(opts.post, null, 2) + "\n",
    },
    {
      path: `${NEWS_DIR}/order.json`,
      text: JSON.stringify(opts.order, null, 2) + "\n",
    },
    ...opts.uploads.map((u) => ({
      path: u.path,
      base64: encodeBase64(u.bytes),
    })),
  ]
  return commitFiles(cfg, opts.message, changes)
}

export async function deletePost(
  cfg: GhConfig,
  postId: string,
  order: string[]
) {
  // 이미지는 기사와 함께 지운다. 남겨 두면 무엇이 쓰이는지 알 수 없는 파일이 쌓인다.
  const media = await listDir(cfg, `${NEWS_MEDIA_DIR}/${postId}`)
  const changes: FileChange[] = [
    { path: `${NEWS_DIR}/${postId}.json`, remove: true },
    ...media
      .filter((e) => e.type === "file")
      .map((e) => ({ path: e.path, remove: true as const })),
    {
      path: `${NEWS_DIR}/order.json`,
      text: JSON.stringify(order.filter((id) => id !== postId), null, 2) + "\n",
    },
  ]
  return commitFiles(cfg, `기사 삭제: ${postId}`, changes)
}

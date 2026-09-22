import { OMNIS_API_BASE as API } from "@/lib/site-env"

import { en } from "./en"
import { ko } from "./ko"
import { DEFAULT_LANG, type Lang } from "./index"
import type { NewsItem, Post, PostLocale, SiteContent } from "./types"

/**
 * 서버 전용 콘텐츠 로더.
 *
 * ★ 클라이언트 컴포넌트에서 임포트하지 말 것. 클라이언트에서 필요한 것(`localePath`,
 *   `AVAILABLE_LANGS`, 타입)은 `@/content` 에 있다.
 *
 * 기사는 Omnis 의 `/api/website/posts` 가 단일 출처다. 예전에는 `content/data/news/*.json`
 * 을 빌드 때 읽었는데(git 이 DB), 관리 화면이 Omnis 로 옮겨 가면서 저장소도 그쪽 DB 로
 * 갔다. 여기서는 60초 캐시로 읽고, 저장이 일어나면 Omnis 가 `/api/revalidate` 를 불러
 * 즉시 갈아 끼운다.
 */

/** 캐시 태그. `/api/revalidate` 가 이 이름으로 비운다. */
export const POSTS_TAG = "posts"

interface PostDto extends Omit<Post, "thumbnail" | "pinned"> {
  position: number
  pinned?: boolean
  thumbnail: string | null
  updatedAt: string
}

function fromDto(dto: PostDto): Post {
  return {
    id: dto.id,
    // 옛 응답에는 없다 — 그때는 전부 뉴스였다.
    category: dto.category === "library" ? "library" : "news",
    // 고정을 모르는 옛 Omnis 가 응답하면 없다. 그때는 고정되지 않은 것으로 본다 —
    // 사이트가 Omnis 보다 먼저 배포돼도 목록이 깨지지 않는다.
    pinned: dto.pinned === true,
    date: dto.date,
    sourceLang: dto.sourceLang,
    thumbnail: dto.thumbnail ?? "",
    externalHref: dto.externalHref,
    content: dto.content,
    ...(dto.deck ? { deck: dto.deck } : {}),
  }
}

/**
 * 목록 순서(최신순)대로 기사 전체.
 *
 * Omnis 가 응답하지 않으면 빈 목록을 돌려준다. 뉴스 한 섹션 때문에 회사 홈페이지 전체가
 * 500 으로 죽는 것보다 뉴스가 잠시 비는 편이 낫다. 실패 응답은 캐시되지 않으므로
 * 다음 요청이 다시 시도한다. 빌드 때도 같다 — 기사 페이지는 요청 시점에 만들어진다.
 */
export async function listPosts(): Promise<Post[]> {
  try {
    const res = await fetch(`${API}/posts`, {
      next: { revalidate: 60, tags: [POSTS_TAG] },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const dtos = (await res.json()) as PostDto[]
    return dtos.map(fromDto)
  } catch (err) {
    console.error(`[content] 기사 목록을 받지 못했다 (${API}):`, err instanceof Error ? err.message : err)
    return []
  }
}

export async function getPost(id: string): Promise<Post | undefined> {
  return (await listPosts()).find((p) => p.id === id)
}

/** 뉴스 글만. 하드:라이브러리는 같은 표에 있지만 다른 화면이다. */
export async function listNews(): Promise<Post[]> {
  return (await listPosts()).filter((p) => p.category !== "library")
}

/** 하드:라이브러리 글만. */
export async function listLibrary(): Promise<Post[]> {
  return (await listPosts()).filter((p) => p.category === "library")
}

/** 해당 언어의 본문. 없으면 원본 언어로 대체한다(번역이 아직 없을 수 있다). */
export function getPostLocale(post: Post, lang: Lang): PostLocale | undefined {
  return post.content[lang] ?? post.content[post.sourceLang]
}

/** 사이트 안에 상세 페이지를 만들 수 있는가 — 본문 블록이 있어야 한다. */
export function hasArticle(post: Post, lang: Lang): boolean {
  return (getPostLocale(post, lang)?.blocks.length ?? 0) > 0
}

/**
 * 글의 원문 주소를 쓸 수 있는지 판정한다. 쓸 수 없으면 `null`.
 *
 * 2026-09-18 까지는 옮기지 않은 글을 아임웹 기본 주소(haddscience.imweb.me)로 보내는 다리가
 * 여기 있었다. 같은 날 글을 전부 옮겼고 아임웹은 해지했으므로 그 주소는 이제 없는 곳이다.
 * 남은 것은 **막는 일**이다 — 옛 원문 주소는 우리 도메인(`haddscience.com/news/?bmode=view&idx=…`)
 * 이나 아임웹을 가리키므로, 링크를 걸면 자기 사이트로 되돌아오거나 죽은 곳으로 보낸다.
 * 언론사 기사처럼 밖을 가리키는 주소만 그대로 쓴다.
 */
export function externalArticleHref(href: string): string | null {
  if (/^https?:\/\/(www\.)?haddscience\.com\//.test(href)) return null
  if (/^https?:\/\/[^/]*imweb\.me\//.test(href)) return null
  return href
}

/** Post → 목록 카드용 NewsItem. 라이브러리 글은 `/library/<id>` 로 보낸다. */
function toNewsItem(post: Post, lang: Lang): NewsItem {
  const locale = getPostLocale(post, lang)
  const article = hasArticle(post, lang)
  return {
    id: post.id,
    date: post.date,
    title: locale?.title ?? post.id,
    // 언어 전용 썸네일이 있으면 그것(영문 카드뉴스의 첫 장), 없으면 공통.
    image: locale?.thumbnail || post.thumbnail,
    summary: locale?.summary || undefined,
    hasArticle: article,
    pinned: post.pinned,
    // 본문이 있으면 사이트 안으로. 본문이 없는 글은 쓸 수 있는 원문 주소가 있을 때만 밖으로 보낸다.
    href:
      (article ? null : post.externalHref ? externalArticleHref(post.externalHref) : null) ??
      `/${post.category === "library" ? "library" : "news"}/${post.id}`,
  }
}

const dictionaries: Record<Lang, SiteContent> = { ko, en }

export async function getContent(lang: Lang): Promise<SiteContent> {
  const base = dictionaries[lang] ?? dictionaries[DEFAULT_LANG]
  const posts = await listPosts()
  const items = (category: Post["category"]) =>
    posts.filter((p) => (p.category === "library") === (category === "library")).map((p) => toNewsItem(p, lang))
  return {
    ...base,
    news: { ...base.news, items: items("news") },
    library: { ...base.library, items: items("library") },
  }
}

/**
 * 기사 상세의 이전/다음 글.
 *
 * 목록 순서는 최신순이므로 배열의 앞이 "다음(최신) 글", 뒤가 "이전 글"이다.
 * 본문이 없는 글은 상세 페이지가 없으므로 건너뛴다 — 넣으면 404 로 간다.
 */
export async function getArticleNeighbors(
  id: string,
  lang: Lang
): Promise<{ prev?: Post; next?: Post }> {
  const all = await listPosts()
  const self = all.find((p) => p.id === id)
  const sameList = all.filter((p) => (p.category === "library") === (self?.category === "library"))
  const articles = sameList.filter((p) => hasArticle(p, lang))
  const i = articles.findIndex((p) => p.id === id)
  if (i < 0) return {}
  return { next: articles[i - 1], prev: articles[i + 1] }
}

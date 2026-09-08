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
const API =
  process.env.OMNIS_API_BASE ?? "https://omnis-hadd.vercel.app/omnis/api/website"

/** 캐시 태그. `/api/revalidate` 가 이 이름으로 비운다. */
export const POSTS_TAG = "posts"

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

/** 해당 언어의 본문. 없으면 원본 언어로 대체한다(번역이 아직 없을 수 있다). */
export function getPostLocale(post: Post, lang: Lang): PostLocale | undefined {
  return post.content[lang] ?? post.content[post.sourceLang]
}

/** 사이트 안에 상세 페이지를 만들 수 있는가 — 본문 블록이 있어야 한다. */
export function hasArticle(post: Post, lang: Lang): boolean {
  return (getPostLocale(post, lang)?.blocks.length ?? 0) > 0
}

/** Post → 목록 카드용 NewsItem. */
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
    // 본문이 있으면 사이트 안으로, 없으면 아임웹 원문으로 보낸다.
    href: article ? `/news/${post.id}` : (post.externalHref ?? `/news/${post.id}`),
  }
}

const dictionaries: Record<Lang, SiteContent> = { ko, en }

export async function getContent(lang: Lang): Promise<SiteContent> {
  const base = dictionaries[lang] ?? dictionaries[DEFAULT_LANG]
  const posts = await listPosts()
  return {
    ...base,
    news: { ...base.news, items: posts.map((p) => toNewsItem(p, lang)) },
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
  const articles = (await listPosts()).filter((p) => hasArticle(p, lang))
  const i = articles.findIndex((p) => p.id === id)
  if (i < 0) return {}
  return { next: articles[i - 1], prev: articles[i + 1] }
}

import fs from "node:fs"
import path from "node:path"

import { en } from "./en"
import { ko } from "./ko"
import { DEFAULT_LANG, type Lang } from "./index"
import type { NewsItem, Post, PostLocale, SiteContent } from "./types"

/**
 * 서버 전용 콘텐츠 로더.
 *
 * ★ 클라이언트 컴포넌트에서 임포트하지 말 것 — `node:fs` 가 클라이언트 번들에 딸려간다.
 *   클라이언트에서 필요한 것(`localePath`, `AVAILABLE_LANGS`, 타입)은 `@/content` 에 있다.
 *   현재 `getContent` 는 `app/` 아래 서버 컴포넌트에서만 쓰인다.
 *
 * 기사는 `content/data/news/*.json` 이 단일 출처다. 빌드 시 한 번 읽어 캐시한다.
 * 번들러용 배럴 파일을 생성하지 않는 이유: 생성물은 원본과 어긋날 수 있고, 새로 클론한
 * 사람이 생성 스크립트를 돌리기 전까지 타입 체크가 깨진다. 48개짜리 JSON 을 빌드 때
 * 한 번 읽는 비용은 무시할 만하다.
 */
const NEWS_DIR = path.join(process.cwd(), "content", "data", "news")

let cache: Post[] | null = null

/** 목록 순서대로 읽은 기사 전체. 파일명 정렬로는 최신순을 복원할 수 없어 order.json 을 쓴다. */
export function listPosts(): Post[] {
  if (cache) return cache
  const order: string[] = JSON.parse(
    fs.readFileSync(path.join(NEWS_DIR, "order.json"), "utf8")
  )
  cache = order.map(
    (id) => JSON.parse(fs.readFileSync(path.join(NEWS_DIR, `${id}.json`), "utf8")) as Post
  )
  return cache
}

export function getPost(id: string): Post | undefined {
  return listPosts().find((p) => p.id === id)
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
    image: post.thumbnail,
    summary: locale?.summary || undefined,
    hasArticle: article,
    // 본문이 있으면 사이트 안으로, 없으면 아임웹 원문으로 보낸다.
    href: article ? `/news/${post.id}` : (post.externalHref ?? `/news/${post.id}`),
  }
}

const dictionaries: Record<Lang, SiteContent> = { ko, en }

export function getContent(lang: Lang): SiteContent {
  const base = dictionaries[lang] ?? dictionaries[DEFAULT_LANG]
  return {
    ...base,
    news: { ...base.news, items: listPosts().map((p) => toNewsItem(p, lang)) },
  }
}

/**
 * 기사 상세의 이전/다음 글.
 *
 * 목록 순서(order.json)는 최신순이므로 배열의 앞이 "다음(최신) 글", 뒤가 "이전 글"이다.
 * 본문이 없는 글은 상세 페이지가 아예 만들어지지 않으므로 건너뛴다 — 넣으면 404 로 간다.
 */
export function getArticleNeighbors(
  id: string,
  lang: Lang
): { prev?: Post; next?: Post } {
  const articles = listPosts().filter((p) => hasArticle(p, lang))
  const i = articles.findIndex((p) => p.id === id)
  if (i < 0) return {}
  return { next: articles[i - 1], prev: articles[i + 1] }
}

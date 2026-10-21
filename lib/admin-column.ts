import { api } from "@/lib/admin-api"
import type { ApiConfig } from "@/lib/admin-config"
import type { PostBlock } from "@/content/types"

/**
 * 칼럼(키워드 추천 → AI 초안 → 대표님 검토 → 라이브러리 게시) API.
 * 경로·응답 형식의 권위는 Omnis `app/api/website/column/**` 와
 * `mydocs/plans/2026-10-16-column-keyword-pipeline.md` 다.
 */

export interface KeywordSource {
  title: string
  url: string
  publisher: string
  date: string | null
}

export type KeywordStatus = "candidate" | "reserved" | "used" | "discarded"
export type DraftStatus = "draft" | "in_review" | "changes_requested" | "approved" | "published"

export interface Keyword {
  id: string
  term: string
  topic: string
  summary: string
  sources: KeywordSource[]
  timelyAt: string | null
  status: KeywordStatus
  reservedById: string | null
  reservedBy: string | null
  nearestPostId: string | null
  nearestTitle: string | null
  nearestScore: number | null
  similarWarn: boolean
  usedCount: number
  drafts: { id: string; status: DraftStatus; by: string | null }[]
  score: number
}

export interface Me {
  id: string
  name: string
  isReviewer: boolean
}

export interface KeywordRun {
  id: string
  startedAt: string
  finishedAt: string | null
  createdBy: string | null
  durationMs: number | null
}

export interface Board {
  keywords: Keyword[]
  lastRun: KeywordRun | null
  me: Me | null
  reused?: boolean
}

export interface DraftSummary {
  id: string
  status: DraftStatus
  title: string
  summary: string
  postId: string | null
  createdBy: string | null
  reviewer: string | null
  reviewNote: string | null
  updatedAt: string
  keyword: { id: string; term: string }
}

/**
 * 이미지 제안 — 검토용. 게시되지 않는다(Omnis `lib/column/image-suggest.ts`).
 * 소제목과는 `heading`(만들 때의 글자)과 `n`(몇 번째 소제목)으로 이어진다 — `placeSuggestions`.
 */
export interface ImageSuggestion {
  id: string
  target: "lead" | "heading"
  heading?: string
  n?: number
  idea: string
  sources: string[]
  prompt: string
  done?: boolean
}

export interface Draft extends DraftSummary {
  blocks: PostBlock[]
  /** 2026-10-21 이전 초안은 null(제안 없음) */
  imageSuggestions?: ImageSuggestion[] | null
  keyword: { id: string; term: string; summary: string; sources: KeywordSource[] }
}

export const loadBoard = (cfg: ApiConfig) => api<Board>(cfg, "/column/keywords")

/** 하루 한 번만 실제로 돈다. 같은 날 다시 누르면 `reused: true` 로 그날 결과가 온다. */
export const collect = (cfg: ApiConfig) => api<Board>(cfg, "/column/keywords", { method: "POST" })

export type KeywordAction =
  | { action: "reserve" | "release" | "discard" | "restore" }
  | { action: "removeSource"; url: string }

export const keywordAction = (cfg: ApiConfig, id: string, body: KeywordAction) =>
  api<{ ok: true }>(cfg, `/column/keywords/${id}`, { method: "POST", body: JSON.stringify(body) })

export const loadDrafts = (cfg: ApiConfig) => api<{ me: Me; drafts: DraftSummary[] }>(cfg, "/column/drafts")

/** 근거 기사를 읽고 Gemini 를 부른다. 30~60초 걸린다. */
export const createDraft = (cfg: ApiConfig, keywordId: string) =>
  api<{ draft: { id: string } }>(cfg, "/column/drafts", { method: "POST", body: JSON.stringify({ keywordId }) })

export const loadDraft = (cfg: ApiConfig, id: string) =>
  api<{ draft: Draft; problems: string[]; me: Me }>(cfg, `/column/drafts/${id}`)

/** `imageSuggestions` 를 빼면 서버가 저장된 제안을 그대로 둔다. */
export const saveDraft = (
  cfg: ApiConfig,
  id: string,
  body: { title: string; summary: string; blocks: PostBlock[]; imageSuggestions?: ImageSuggestion[] }
) =>
  api<{ problems: string[] }>(cfg, `/column/drafts/${id}`, { method: "PUT", body: JSON.stringify(body) })

export const deleteDraft = (cfg: ApiConfig, id: string) => api<{ ok: true }>(cfg, `/column/drafts/${id}`, { method: "DELETE" })

export const requestReview = (cfg: ApiConfig, id: string) => api(cfg, `/column/drafts/${id}/review`, { method: "POST" })

export const decide = (cfg: ApiConfig, id: string, decision: "approve" | "request_changes", note?: string) =>
  api(cfg, `/column/drafts/${id}/decide`, { method: "POST", body: JSON.stringify({ decision, note }) })

export const publish = (cfg: ApiConfig, id: string) =>
  api<{ post: { id: string }; translationFailures: string[] }>(cfg, `/column/drafts/${id}/publish`, { method: "POST" })

/** 사진은 고르는 즉시 올린다 — 초안은 서버에만 있어서, 기사 편집기처럼 저장 때 모아 올릴 곳이 없다. */
export async function uploadDraftImage(cfg: ApiConfig, postId: string, bytes: Uint8Array): Promise<string> {
  const { url } = await api<{ url: string }>(cfg, "/media", {
    method: "POST",
    raw: bytes as unknown as BodyInit,
    headers: { "Content-Type": "image/webp", "X-Post-Id": postId },
  })
  return url
}

export const DRAFT_LABEL: Record<DraftStatus, string> = {
  draft: "초안",
  in_review: "검토 중",
  changes_requested: "수정 요청",
  approved: "승인",
  published: "게시됨",
}

export const KEYWORD_LABEL: Record<KeywordStatus, string> = {
  candidate: "후보",
  reserved: "예약됨",
  used: "사용됨",
  discarded: "버림",
}

/**
 * 제안을 놓을 자리. 글자가 같은 소제목을 먼저 찾고, 없으면 n 번째 소제목에 붙인다 —
 * 소제목을 고쳐 쓰는 동안에도 상자가 제자리에 있고, 순서를 바꿔도 따라간다.
 * 둘 다 안 되면(소제목을 지웠을 때) `unplaced` 로 모아 글 맨 앞에 보인다.
 */
export function placeSuggestions(blocks: PostBlock[], list: ImageSuggestion[] | null | undefined) {
  const headings = blocks.flatMap((b, i) => (b.type === "heading" ? [i] : []))
  const text = (i: number) => (blocks[i].type === "heading" ? blocks[i].text.trim() : "")
  const at = new Map<number, ImageSuggestion[]>()
  const lead: ImageSuggestion[] = []
  const unplaced: ImageSuggestion[] = []
  const used = new Set<number>()
  const put = (i: number, s: ImageSuggestion) => {
    used.add(i)
    at.set(i, [...(at.get(i) ?? []), s])
  }
  const rest: ImageSuggestion[] = []
  for (const s of list ?? []) {
    if (s.target === "lead") lead.push(s)
    else {
      const i = headings.find((h) => !used.has(h) && !!s.heading && text(h) === s.heading.trim())
      if (i === undefined) rest.push(s)
      else put(i, s)
    }
  }
  for (const s of rest) {
    const i = s.n === undefined ? undefined : headings[s.n]
    if (i === undefined || used.has(i)) unplaced.push(s)
    else put(i, s)
  }
  return { lead, at, unplaced }
}

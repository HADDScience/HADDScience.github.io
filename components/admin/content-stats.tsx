"use client"

import * as React from "react"

import type { Lang, Post } from "@/content/types"
import { cn } from "@/lib/utils"

/**
 * 콘텐츠 현황 패널.
 *
 * 목록 위에 붙는 요약이다. 숫자는 전부 이미 받아 둔 기사 목록에서 센다 — 통계 때문에
 * API 를 새로 부르지 않는다. 화면에 있는 것과 다른 수가 나오면 그게 더 큰 문제다.
 *
 * "손볼 것"은 장식이 아니라 **필터**다. 눌러야 할 일이 화면에 뜨는데 그 글을 찾으러
 * 목록을 훑어야 한다면 숫자를 보여 준 보람이 없다.
 */

/* ------------------------------------------------------------ 결함 정의 */

export type IssueKey =
  "untranslated" | "no-body" | "no-thumbnail" | "no-summary"

const otherLang = (p: Post): Lang => (p.sourceLang === "ko" ? "en" : "ko")
const bodyLen = (p: Post) => p.content[p.sourceLang]?.blocks.length ?? 0

/**
 * 한 글이 그 결함에 해당하는가.
 *
 * 본문이 없는 글은 번역·요약 항목에서 뺀다. 본문이 없으면 번역할 것도 요약할 것도
 * 없어서, 한 글이 칩 세 개에 동시에 잡히면 "무엇부터 하면 되는지"가 사라진다.
 */
export function matchesIssue(post: Post, key: IssueKey): boolean {
  switch (key) {
    case "untranslated":
      return (
        bodyLen(post) > 0 &&
        (post.content[otherLang(post)]?.blocks.length ?? 0) === 0
      )
    case "no-body":
      return bodyLen(post) === 0
    case "no-thumbnail":
      return !post.thumbnail
    case "no-summary":
      return (
        bodyLen(post) > 0 &&
        !(post.content[post.sourceLang]?.summary ?? "").trim()
      )
  }
}

const ISSUES: { key: IssueKey; label: string; hint: string }[] = [
  {
    key: "untranslated",
    label: "번역 없음",
    hint: "원문 말고 다른 언어의 본문이 비어 있다",
  },
  {
    key: "no-body",
    label: "본문 없음",
    hint: "본문 블록이 하나도 없다 (외부 링크만 있는 글)",
  },
  {
    key: "no-thumbnail",
    label: "썸네일 없음",
    hint: "목록 카드에 보일 사진이 없다",
  },
  {
    key: "no-summary",
    label: "요약 없음",
    hint: "목록 설명과 검색 결과에 쓸 한두 문장이 없다",
  },
]

/* ------------------------------------------------------------ 날짜 세기 */

/** `2026.08.05` → `2026-08`. 형식이 다르면 null. */
function monthOf(date: string): string | null {
  const m = /^(\d{4})\.(\d{2})/.exec(date)
  return m ? `${m[1]}-${m[2]}` : null
}

/** 이번 달까지 최근 12개월의 건수. 글이 없는 달도 자리를 지킨다. */
function lastTwelveMonths(posts: Post[], now: Date) {
  const months: { key: string; label: string; count: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    months.push({ key, label: `${d.getMonth() + 1}월`, count: 0 })
  }
  const slot = new Map(months.map((m) => [m.key, m]))
  for (const p of posts) {
    const key = monthOf(p.date)
    const hit = key ? slot.get(key) : undefined
    if (hit) hit.count += 1
  }
  return months
}

/* ------------------------------------------------------------ 화면 */

export function ContentStats({
  posts,
  total,
  label,
  issue,
  onIssue,
}: {
  /** 지금 보고 있는 탭의 글. */
  posts: Post[]
  /** 뉴스 + 라이브러리 전체 건수. */
  total: number
  /** 탭 이름 — "뉴스" · "하드:라이브러리" */
  label: string
  issue: IssueKey | null
  onIssue: (key: IssueKey | null) => void
}) {
  // 달 계산의 기준. 렌더마다 new Date() 를 부르면 값이 흔들린다.
  const now = React.useMemo(() => new Date(), [])
  const months = React.useMemo(() => lastTwelveMonths(posts, now), [posts, now])

  const decks = posts.filter((p) => p.deck)
  const cards = decks.reduce((n, p) => n + (p.deck?.cards.length ?? 0), 0)
  const translated = posts.filter(
    (p) => (p.content[otherLang(p)]?.blocks.length ?? 0) > 0
  ).length
  const recent = months.reduce((n, m) => n + m.count, 0)
  const latest = posts.reduce((a, p) => (p.date > a ? p.date : a), "")
  const peak = Math.max(1, ...months.map((m) => m.count))

  const counts = Object.fromEntries(
    ISSUES.map((i) => [
      i.key,
      posts.filter((p) => matchesIssue(p, i.key)).length,
    ])
  ) as Record<IssueKey, number>

  return (
    <section
      aria-label="콘텐츠 현황"
      className="mb-4 grid min-w-0 gap-5 rounded-lg border border-border bg-card p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          value={String(posts.length)}
          unit="건"
          label={label}
          note={`전체 ${total}건 가운데`}
        />
        <Tile
          value={String(decks.length)}
          unit="건"
          label="카드뉴스"
          note={cards ? `카드 ${cards}장` : "아직 없다"}
        />
        <Tile
          value={String(translated)}
          unit={`/ ${posts.length}`}
          label="번역 있음"
          note={
            posts.length
              ? `${Math.round((translated / posts.length) * 100)}%`
              : "글이 없다"
          }
        />
        <Tile
          value={String(recent)}
          unit="건"
          label="최근 12개월"
          note={latest ? `마지막 글 ${latest}` : "글이 없다"}
        />
      </div>

      {/* 손볼 것 — 누르면 목록이 그 글만 남는다 */}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="mr-1 text-xs font-semibold text-muted-foreground">
          손볼 것
        </p>
        {ISSUES.map((i) => {
          const n = counts[i.key]
          const on = issue === i.key
          return (
            <button
              key={i.key}
              type="button"
              title={i.hint}
              disabled={!n}
              aria-pressed={on}
              onClick={() => onIssue(on ? null : i.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-120 ease-[var(--ease-standard)]",
                !n
                  ? "border-border text-muted-foreground"
                  : on
                    ? "border-brand-blue-700 bg-brand-blue-700 text-white"
                    : "border-border hover:border-brand-blue-500"
              )}
            >
              {i.label}
              <span
                className={cn(
                  "font-mono",
                  on ? "text-white" : "text-muted-foreground"
                )}
              >
                {n}
              </span>
            </button>
          )
        })}
        {issue ? (
          <button
            type="button"
            onClick={() => onIssue(null)}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            필터 해제
          </button>
        ) : null}
      </div>

      <Trend months={months} peak={peak} />
    </section>
  )
}

function Tile({
  value,
  unit,
  label,
  note,
}: {
  value: string
  unit: string
  label: string
  note: string
}) {
  return (
    <div className="min-w-0 rounded-[12px] bg-muted/50 px-4 py-3">
      <p className="truncate text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-[-0.02em] tabular-nums">
          {value}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground tabular-nums">
        {note}
      </p>
    </div>
  )
}

/**
 * 월별 발행 건수. 한 갈래뿐이라 범례가 없고, 막대는 브랜드 블루 한 색이다
 * (여러 색은 없는 구분을 있는 것처럼 보이게 한다).
 */
function Trend({
  months,
  peak,
}: {
  months: { key: string; label: string; count: number }[]
  peak: number
}) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 text-xs font-semibold text-muted-foreground">
        월별 발행 (최근 12개월)
      </figcaption>
      <ul className="flex h-20 items-end gap-0.5">
        {months.map((m) => (
          <li
            key={m.key}
            className="group/bar relative flex h-full flex-1 items-end"
          >
            <span className="sr-only">
              {m.key.replace("-", "년 ")}월 {m.count}건
            </span>
            <span
              aria-hidden
              className={cn(
                "mx-auto w-full max-w-9 rounded-t-[4px]",
                m.count ? "bg-brand-blue-700" : "bg-border"
              )}
              style={{ height: m.count ? `${(m.count / peak) * 100}%` : "2px" }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-[8px] bg-foreground px-2 py-1 text-[10px] whitespace-nowrap text-background tabular-nums opacity-0 transition-opacity duration-120 ease-[var(--ease-standard)] group-hover/bar:opacity-100"
            >
              {m.key} · {m.count}건
            </span>
          </li>
        ))}
      </ul>
      <ul aria-hidden className="mt-1 flex gap-0.5">
        {months.map((m, i) => (
          <li
            key={m.key}
            className="flex-1 text-center text-[10px] text-muted-foreground tabular-nums"
          >
            {i % 3 === 0 || i === months.length - 1 ? m.label : ""}
          </li>
        ))}
      </ul>
    </figure>
  )
}

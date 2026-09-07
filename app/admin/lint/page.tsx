"use client"

import * as React from "react"

import { CardFace } from "@/components/cardnews/card-face"
import { Button } from "@/components/ui/button"
import type { CardDeck } from "@/content/types"
import { CARD_SIZE } from "@/lib/cardnews"
import { rasterizeCard, waitForAssets } from "@/lib/cardnews-export"
import { lintCard, type LayoutIssue } from "@/lib/cardnews-lint"

/**
 * 카드뉴스 조판 검사대.
 *
 * 덱 JSON 을 넣으면 카드를 **원본 크기(1080)** 로 그리고 카드마다 `lintCard` 결과를 보여준다.
 * 미리보기는 transform 으로 축소돼 있어 줄바꿈이 미세하게 달라질 수 있으므로, 옛 카드뉴스를
 * 다시 쓰는 반복 작업은 이 화면의 1:1 렌더를 기준으로 삼는다.
 *
 * 로그인이 없다 — 넣은 JSON 을 그릴 뿐이고 저장소에 닿지 않는다. 검색 색인은 admin 레이아웃이 막는다.
 *
 * 자동화는 `window.__cardnews` 로 붙는다. 사람이 눈으로 보는 것과 스크립트가 읽는 것이
 * 같은 DOM 이어야 "화면은 멀쩡한데 스크립트만 통과" 같은 어긋남이 생기지 않는다.
 */

export interface CardnewsBridge {
  /** 덱을 그리고 폰트·사진이 준비된 뒤 카드별 문제를 돌려준다. */
  load(deckJson: string): Promise<{ issues: LayoutIssue[][] }>
  /** `index` 번째(0부터) 카드를 1080×1080 PNG data URL 로 굽는다. */
  png(index: number): Promise<string>
  /** 지금 그려져 있는 카드 수. */
  count(): number
}

declare global {
  interface Window {
    __cardnews?: CardnewsBridge
  }
}

const SAMPLE = `{
  "handle": "@haddscience",
  "cards": [
    { "type": "cover", "title": "카드뉴스 제목", "cta": "haddscience 알아보기" },
    {
      "type": "chapter",
      "layout": "standard",
      "badge": "chapter 01",
      "headline": "제목",
      "body": "본문을 여기에 붙여 넣습니다."
    }
  ]
}`

/** 카드 루트들이 폰트·사진까지 준비된 뒤 조판을 검사한다. */
async function lintAll(roots: HTMLElement[]): Promise<LayoutIssue[][]> {
  for (const root of roots) await waitForAssets(root)
  // 폰트가 바뀌면 줄이 다시 접힌다. 브라우저가 그 레이아웃을 반영할 프레임을 한 번 준다.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  return roots.map((root) => lintCard(root))
}

export default function CardnewsLintPage() {
  const [text, setText] = React.useState(SAMPLE)
  const [deck, setDeck] = React.useState<CardDeck | null>(null)
  const [issues, setIssues] = React.useState<LayoutIssue[][]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const roots = React.useRef<(HTMLDivElement | null)[]>([])
  const pending = React.useRef<((found: LayoutIssue[][]) => void) | null>(null)
  const deckRef = React.useRef<CardDeck | null>(null)

  /* 덱이 바뀌면 다시 그린 뒤 검사한다. 렌더 → 폰트·사진 대기 → lint 순서를 지켜야
     "아직 안 그려진 카드를 검사해 문제 없음" 이 나오지 않는다. */
  React.useEffect(() => {
    deckRef.current = deck
    if (!deck) return
    let cancelled = false
    void (async () => {
      const nodes = roots.current
        .slice(0, deck.cards.length)
        .filter((n): n is HTMLDivElement => n !== null)
      const found = await lintAll(nodes)
      if (cancelled) return
      setIssues(found)
      setBusy(false)
      pending.current?.(found)
      pending.current = null
    })()
    return () => {
      cancelled = true
    }
  }, [deck])

  const run = React.useCallback(
    (next: CardDeck) =>
      new Promise<LayoutIssue[][]>((resolve) => {
        pending.current = resolve
        roots.current = []
        setError(null)
        setBusy(true)
        setDeck(next)
      }),
    []
  )

  const check = React.useCallback(() => {
    let parsed: CardDeck
    try {
      parsed = JSON.parse(text) as CardDeck
    } catch (err) {
      setError(err instanceof Error ? err.message : "JSON 을 읽지 못했습니다")
      return
    }
    if (!Array.isArray(parsed?.cards)) {
      setError("cards 배열이 없습니다")
      return
    }
    void run(parsed)
  }, [run, text])

  /* ------------------------------------------------------------ 자동화 */

  React.useEffect(() => {
    const bridge: CardnewsBridge = {
      async load(deckJson) {
        const parsed = JSON.parse(deckJson) as CardDeck
        if (!Array.isArray(parsed?.cards)) throw new Error("cards 배열이 없습니다")
        setText(deckJson)
        return { issues: await run(parsed) }
      },
      async png(index) {
        const node = roots.current[index]
        if (!node) throw new Error(`${index} 번 카드가 없습니다`)
        const canvas = await rasterizeCard(node)
        return canvas.toDataURL("image/png")
      },
      count() {
        return deckRef.current?.cards.length ?? 0
      },
    }
    window.__cardnews = bridge
    return () => {
      if (window.__cardnews === bridge) delete window.__cardnews
    }
  }, [run])

  return (
    <main className="grid min-h-svh gap-6 p-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <section className="grid content-start gap-3 lg:sticky lg:top-6 lg:h-[calc(100svh-3rem)] lg:grid-rows-[auto_1fr_auto]">
        <div>
          <h1 className="text-xl font-bold tracking-[-0.02em]">카드뉴스 조판 검사</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            덱 JSON 을 넣으면 원본 크기로 그리고 넘침 · 고아 줄을 찾습니다.
          </p>
        </div>
        <textarea
          value={text}
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
          aria-label="덱 JSON"
          className="min-h-64 w-full resize-none rounded-lg border border-border bg-card p-3 font-mono text-xs leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        <div className="grid gap-2">
          {error ? (
            <p role="alert" className="rounded-lg bg-destructive/8 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button onClick={check} disabled={busy} className="justify-self-start">
            {busy ? "검사 중…" : "검사"}
          </Button>
        </div>
      </section>

      <section className="min-w-0">
        {deck ? (
          <ol className="grid gap-8 overflow-x-auto">
            {deck.cards.map((card, i) => (
              <li key={i} className="grid gap-3" style={{ width: CARD_SIZE }}>
                <p className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {i + 1} / {deck.cards.length} · {card.type}
                  {card.type === "chapter" ? ` · ${card.layout}` : ""}
                </p>
                <div className="overflow-hidden rounded-lg border border-border">
                  <CardFace
                    card={card}
                    deck={deck}
                    ref={(el) => {
                      roots.current[i] = el
                    }}
                  />
                </div>
                <IssueList issues={issues[i]} busy={busy} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            왼쪽에 덱 JSON 을 넣고 검사를 누르세요.
          </p>
        )}
      </section>
    </main>
  )
}

function IssueList({ issues, busy }: { issues: LayoutIssue[] | undefined; busy: boolean }) {
  if (busy || !issues) {
    return <p className="text-sm text-muted-foreground">검사 중…</p>
  }
  if (issues.length === 0) {
    return <p className="text-sm font-semibold text-brand-blue-700">문제 없음</p>
  }
  return (
    <ul className="grid gap-2">
      {issues.map((issue, i) => (
        <li
          key={i}
          className={
            issue.kind === "overflow"
              ? "rounded-lg bg-destructive/8 p-3 text-sm text-destructive"
              : "rounded-lg bg-brand-orange-500/10 p-3 text-sm text-brand-orange-600"
          }
        >
          {issue.message}
        </li>
      ))}
    </ul>
  )
}

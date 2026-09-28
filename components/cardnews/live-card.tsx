"use client"

import * as React from "react"

import type { Card, CardDeck } from "@/content/types"
import { CARD_SIZE } from "@/lib/cardnews"

import { CardFace, CardImageLoading } from "./card-face"
import "./live-card.css"

/**
 * 기사 페이지에 카드뉴스 한 장을 **구운 이미지가 아니라 HTML 로** 그린다.
 *
 * 왜 (2026-09-28)
 *   카드 안의 글이 이미지로 구워져 있으면 검색엔진은 alt 만 읽고, 스크린리더도 alt 에
 *   기댄다. 편집기는 원본(`post.deck`)을 이 `CardFace` 로 그린 뒤 그 DOM 을 굽는다 —
 *   굽기 전 단계를 그대로 보여 주면 글자가 본문이 된다. 같은 DOM 이라 구운 결과와 같은
 *   그림이다. 계획서 `mydocs/plans/archives/2026-09-28-live-cardnews.md`.
 *
 * 크기
 *   카드는 1080×1080 고정으로 설계돼 있다. 글꼴·여백을 다시 계산하지 않고 통째로
 *   `transform: scale()` 로 줄인다 — 편집기 `CardPreview` 와 같은 방식이고, 그래서 구운
 *   이미지와 픽셀 단위로 같다. 다만 본문 폭이 화면마다 달라 비율을 고정할 수 없으므로
 *   `ResizeObserver` 로 폭을 재서 `--cn-scale` 을 넣는다.
 *
 *   하이드레이션 전(자바스크립트가 붙기 전)에는 `live-card.css` 가 화면 폭 구간마다 기본값을
 *   준다. 구간의 **가장 좁은 폭** 기준이라 카드가 상자보다 조금 작게 그려질 뿐 잘리지 않는다.
 */
export function LiveCard({
  card,
  deck,
  label,
}: {
  card: Card
  deck: CardDeck
  /** 스크린리더에 들려줄 위치. "카드 3/12" */
  label: string
}) {
  const ref = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    // 상태로 두지 않고 스타일만 바꾼다. 폭이 바뀔 때마다 카드 DOM 전체를 다시 그릴 이유가 없다.
    const apply = (width: number) => el.style.setProperty("--cn-scale", String(width / CARD_SIZE))
    apply(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => apply(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <figure
      ref={ref}
      aria-label={label}
      // 구운 이미지(PostBody 의 image 블록)와 같은 모서리·바탕.
      className="live-card relative aspect-square w-full overflow-hidden rounded-lg bg-muted"
    >
      <div className="live-card-canvas" style={{ width: CARD_SIZE, height: CARD_SIZE }}>
        {/* 기사 페이지에서는 카드 사진을 화면에 가까워질 때 받는다. 굽는 무대는 기본값(즉시). */}
        <CardImageLoading value="lazy">
          <CardFace card={card} deck={deck} />
        </CardImageLoading>
      </div>
    </figure>
  )
}

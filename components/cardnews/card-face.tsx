"use client"

import * as React from "react"

import type { Card, CardDeck, CardImage } from "@/content/types"
import { CARD_SIZE, defaultRatio } from "@/lib/cardnews"

import "./card.css"

/**
 * 카드뉴스 카드 한 장의 화면.
 *
 * 스킬 hadd-cardnews 의 build_cardnews.py 가 만드는 HTML 을 JSX 로 1:1 옮긴 것이다.
 * 그쪽 스크립트가 디자인의 원본이고, 여기는 브라우저에서 같은 그림을 그려
 * 미리보기와 래스터화(html-to-image)에 쓴다. 구조가 어긋나면 스크립트가 정답.
 *
 * `next/image` 를 쓰지 않는 이유: 이 DOM 은 그대로 캔버스로 구워지는 대상이라
 * srcset · lazy loading 같은 최적화가 오히려 방해가 된다. 크기도 1080 고정이다.
 */

const LOGO_SRC = "/cardnews/logo-hadd-wordmark.png"
const HAND_SRC = "/cardnews/cursor-hand.svg"

/**
 * 스크립트의 `_esc` 와 같다. 전부 이스케이프한 뒤 `<b>` 하나만 되살린다.
 * 본문에 마크업을 허용하면 덱이 HTML 조각이 되어 번역·재사용이 어려워지므로
 * 강조 하나만 예외다. 그 밖의 태그는 글자 그대로 보인다.
 */
function richText(s: string | undefined): string {
  if (!s) return ""
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\n/g, "<br>")
    .replace(/&lt;b&gt;/gi, "<b>")
    .replace(/&lt;\/b&gt;/gi, "</b>")
}

function Rich({
  className,
  text,
  style,
}: {
  className: string
  text: string | undefined
  style?: React.CSSProperties
}) {
  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: richText(text) }}
    />
  )
}

type Resolve = ((src: string) => string) | undefined

/** 고정 종횡비 박스 안의 사진. 비율이 달라도 카드 안 위치·영역이 일정하다. */
function ImgBox({
  image,
  ratio,
  resolveSrc,
  className,
}: {
  image: CardImage | undefined
  ratio: string
  resolveSrc: Resolve
  className?: string
}) {
  if (!image?.src) return null
  return (
    <div
      className={className ? `imgbox ${className}` : "imgbox"}
      style={{ aspectRatio: ratio }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 래스터화 대상이라 최적화 불가 */}
      <img
        src={resolveSrc ? resolveSrc(image.src) : image.src}
        alt=""
        draggable={false}
        style={{ objectPosition: image.pos ?? "center" }}
      />
    </div>
  )
}

function Body({ text }: { text: string | undefined }) {
  if (!text) return null
  return <Rich className="body" text={text} />
}

/* ---------------------------------------------------------------- 카드 */

function Cover({ card, deck }: { card: Extract<Card, { type: "cover" }>; deck: CardDeck }) {
  return (
    <div className="frame">
      <div className="card">
        <div className="pad col" style={{ height: "100%" }}>
          <div className="grow" />
          {/* eslint-disable-next-line @next/next/no-img-element -- 래스터화 대상이라 최적화 불가 */}
          <img className="cover-logo" src={LOGO_SRC} alt="" draggable={false} />
          <Rich className="cover-title" text={card.title} />
          <div style={{ margin: "24px 0 8px" }}>
            <span className="cta">
              <span dangerouslySetInnerHTML={{ __html: richText(card.cta) }} />
              {/* eslint-disable-next-line @next/next/no-img-element -- 래스터화 대상이라 최적화 불가 */}
              <img className="hand" src={HAND_SRC} alt="" draggable={false} />
            </span>
          </div>
          <div className="grow" />
          <Rich className="handle" text={card.handle || deck.handle} />
          <div style={{ height: 26 }} />
        </div>
      </div>
    </div>
  )
}

function Quote({
  card,
  resolveSrc,
}: {
  card: Extract<Card, { type: "quote" }>
  resolveSrc: Resolve
}) {
  return (
    <div className="frame">
      <div className="card">
        <div className="pad col" style={{ height: "100%", justifyContent: "center" }}>
          {card.badge ? (
            <>
              <Rich className="badge" text={card.badge} />
              <div className="gap-m" />
            </>
          ) : null}
          {card.quote ? <Rich className="quote" text={card.quote} /> : null}
          {card.attrib ? (
            <>
              <div className="gap-s" />
              <Rich className="attrib" text={card.attrib} />
            </>
          ) : null}
          {card.image?.src ? (
            <>
              <div className="gap-m" />
              <ImgBox
                image={card.image}
                ratio={card.image.ratio ?? defaultRatio(card)}
                resolveSrc={resolveSrc}
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

type Chapter = Extract<Card, { type: "chapter" }>

function Standard({
  card,
  resolveSrc,
}: {
  card: Extract<Chapter, { layout: "standard" }>
  resolveSrc: Resolve
}) {
  const hclass = card.headlineSize ? `headline ${card.headlineSize}` : "headline"
  return (
    <div className="frame">
      <div className="card">
        <div className="pad col" style={{ height: "100%", justifyContent: "center" }}>
          {card.badge ? (
            <>
              <Rich className="badge" text={card.badge} />
              <div className="gap-m" />
            </>
          ) : null}
          {card.headline ? <Rich className={hclass} text={card.headline} /> : null}
          {card.subtitle ? (
            <>
              <div className="gap-s" />
              <Rich className="subtitle" text={card.subtitle} />
            </>
          ) : null}
          {card.image?.src ? (
            <>
              <div className="gap-m" />
              <ImgBox
                image={card.image}
                ratio={card.image.ratio ?? defaultRatio(card)}
                resolveSrc={resolveSrc}
              />
            </>
          ) : null}
          {/* 상단 정렬 고정, 아래 여백 유동 */}
          <div className="grow" />
          <Body text={card.body} />
          {card.footnote ? (
            <>
              <div className="gap-s" />
              <Rich className="footnote" text={card.footnote} />
            </>
          ) : null}
          <div className="grow" />
        </div>
      </div>
    </div>
  )
}

function ImageTop({
  card,
  resolveSrc,
}: {
  card: Extract<Chapter, { layout: "image-top" }>
  resolveSrc: Resolve
}) {
  return (
    <div className="frame">
      <div className="card">
        {card.image?.src ? (
          <div className="hero">
            <ImgBox
              image={card.image}
              ratio={card.image.ratio ?? defaultRatio(card)}
              resolveSrc={resolveSrc}
            />
          </div>
        ) : null}
        <div className="pad col grow" style={{ justifyContent: "center" }}>
          {card.badge ? (
            <>
              <Rich className="badge" text={card.badge} />
              <div className="gap-m" />
            </>
          ) : null}
          {card.headline ? <Rich className="headline" text={card.headline} /> : null}
          {card.subtitle ? (
            <>
              <div className="gap-s" />
              <Rich className="subtitle" text={card.subtitle} />
            </>
          ) : null}
          {card.body ? (
            <>
              <div className="gap-m" />
              <Body text={card.body} />
            </>
          ) : null}
          {card.footnote ? (
            <>
              <div className="gap-s" />
              <Rich className="footnote" text={card.footnote} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Split({
  card,
  resolveSrc,
}: {
  card: Extract<Chapter, { layout: "split" }>
  resolveSrc: Resolve
}) {
  const contain = card.imageFit === "contain"
  return (
    <div className="frame">
      <div className="card">
        <div className="split">
          {card.image?.src ? (
            <div className={contain ? "split-media contain" : "split-media"}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 래스터화 대상이라 최적화 불가 */}
              <img
                src={resolveSrc ? resolveSrc(card.image.src) : card.image.src}
                alt=""
                draggable={false}
                style={{ objectPosition: card.image.pos ?? "center" }}
              />
            </div>
          ) : null}
          <div className="split-body">
            {card.badge ? (
              <>
                <Rich className="badge" text={card.badge} />
                <div className="gap-m" />
              </>
            ) : null}
            {card.headline ? <Rich className="headline" text={card.headline} /> : null}
            {card.subtitle ? (
              <>
                <div className="gap-s" />
                <Rich className="subtitle" text={card.subtitle} />
              </>
            ) : null}
            {card.body ? (
              <>
                <div className="gap-m" />
                <Body text={card.body} />
              </>
            ) : null}
            {card.footnote ? (
              <>
                <div className="gap-m" />
                <Rich className="footnote" text={card.footnote} />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function Overlay({
  card,
  resolveSrc,
}: {
  card: Extract<Chapter, { layout: "overlay" }>
  resolveSrc: Resolve
}) {
  return (
    <div className="frame">
      <div className="card">
        <div className="overlay-wrap">
          {card.image?.src ? (
            /* eslint-disable-next-line @next/next/no-img-element -- 래스터화 대상이라 최적화 불가 */
            <img
              src={resolveSrc ? resolveSrc(card.image.src) : card.image.src}
              alt=""
              draggable={false}
              style={{ objectPosition: card.image.pos ?? "center" }}
            />
          ) : null}
          <div className="overlay-shade" />
          <div className="overlay-text">
            {card.badge ? <Rich className="badge" text={card.badge} /> : null}
            {card.headline ? <Rich className="headline" text={card.headline} /> : null}
            {card.body ? (
              <>
                <div className="gap-s" />
                <Body text={card.body} />
              </>
            ) : null}
            {card.footnote ? (
              <>
                <div className="gap-s" />
                <Rich className="footnote" text={card.footnote} />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function TextOnly({ card }: { card: Extract<Chapter, { layout: "text" }> }) {
  return (
    <div className="frame">
      <div className="card">
        <div className="pad col" style={{ height: "100%", justifyContent: "center" }}>
          {card.badge ? (
            <>
              <Rich className="badge" text={card.badge} />
              <div className="gap-l" />
            </>
          ) : null}
          {card.headline ? <Rich className="big" text={card.headline} /> : null}
          {card.body ? (
            <>
              <div className="gap-m" />
              <Body text={card.body} />
            </>
          ) : null}
          {card.footnote ? (
            <>
              <div className="gap-l" />
              <Rich className="footnote" text={card.footnote} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Stat({ card }: { card: Extract<Chapter, { layout: "stat" }> }) {
  const stats = card.stats
  return (
    <div className="frame">
      <div className="card">
        <div className="pad col" style={{ height: "100%", justifyContent: "center" }}>
          {card.badge ? (
            <>
              <Rich className="badge" text={card.badge} />
              <div className="gap-l" />
            </>
          ) : null}
          {card.headline ? (
            <>
              <Rich className="headline" text={card.headline} />
              <div className="gap-l" />
            </>
          ) : null}
          {stats.length > 1 ? (
            <div className="stat-row">
              {stats.map((s, i) => (
                <div className="stat-item" key={i}>
                  <div className="stat-value">
                    <span dangerouslySetInnerHTML={{ __html: richText(s.value) }} />
                    {s.unit ? (
                      <span
                        className="stat-unit"
                        dangerouslySetInnerHTML={{ __html: richText(s.unit) }}
                      />
                    ) : null}
                  </div>
                  <Rich className="stat-label" text={s.label} />
                </div>
              ))}
            </div>
          ) : stats.length === 1 ? (
            <>
              <div className="stat-value">
                <span dangerouslySetInnerHTML={{ __html: richText(stats[0].value) }} />
                {stats[0].unit ? (
                  <span
                    className="stat-unit"
                    dangerouslySetInnerHTML={{ __html: richText(stats[0].unit) }}
                  />
                ) : null}
              </div>
              {stats[0].label ? <Rich className="stat-label" text={stats[0].label} /> : null}
            </>
          ) : null}
          {card.body ? (
            <>
              <div className="gap-l" />
              <Body text={card.body} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function List({ card }: { card: Extract<Chapter, { layout: "list" }> }) {
  return (
    <div className="frame">
      <div className="card">
        <div className="pad col" style={{ height: "100%", justifyContent: "center" }}>
          {card.badge ? (
            <>
              <Rich className="badge" text={card.badge} />
              <div className="gap-m" />
            </>
          ) : null}
          {card.headline ? (
            <>
              <Rich className="headline sm" text={card.headline} />
              <div className="gap-m" />
            </>
          ) : null}
          <div className="list">
            {card.items.map((it, i) => {
              const mark =
                card.marker === "bullet"
                  ? "•"
                  : card.marker === "emoji"
                    ? it.emoji || "✅"
                    : String(i + 1)
              return (
                <div className="list-item" key={i}>
                  <Rich className="list-mark" text={mark} />
                  <div className="list-body">
                    <Rich className="list-title" text={it.title} />
                    {it.desc ? <Rich className="list-desc" text={it.desc} /> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChapterFace({ card, resolveSrc }: { card: Chapter; resolveSrc: Resolve }) {
  switch (card.layout) {
    case "standard":
      return <Standard card={card} resolveSrc={resolveSrc} />
    case "image-top":
      return <ImageTop card={card} resolveSrc={resolveSrc} />
    case "split":
      return <Split card={card} resolveSrc={resolveSrc} />
    case "overlay":
      return <Overlay card={card} resolveSrc={resolveSrc} />
    case "text":
      return <TextOnly card={card} />
    case "stat":
      return <Stat card={card} />
    case "list":
      return <List card={card} />
  }
}

/* ------------------------------------------------------------- export */

export interface CardFaceProps {
  card: Card
  deck: CardDeck
  /** 아직 커밋하지 않은 사진을 blob: URL 로 보여주기 위한 경로 변환. */
  resolveSrc?: (src: string) => string
  /** 래스터화할 때 잡을 루트(1080×1080). */
  ref?: React.Ref<HTMLDivElement>
}

/** 실제 크기(1080×1080)의 카드. 미리보기는 `CardPreview` 로 줄여서 쓴다. */
export function CardFace({ card, deck, resolveSrc, ref }: CardFaceProps) {
  return (
    <div className="cn-root" ref={ref}>
      {card.type === "cover" ? (
        <Cover card={card} deck={deck} />
      ) : card.type === "quote" ? (
        <Quote card={card} resolveSrc={resolveSrc} />
      ) : (
        <ChapterFace card={card} resolveSrc={resolveSrc} />
      )}
    </div>
  )
}

export interface CardPreviewProps {
  card: Card
  deck: CardDeck
  resolveSrc?: (src: string) => string
  /** 화면에서 차지할 한 변의 길이(px). */
  width: number
  className?: string
}

/**
 * 카드를 `width` 크기로 줄여 보여준다. 폰트·여백을 다시 계산하지 않고 1080 캔버스를
 * transform 으로 축소하므로, 미리보기와 실제 결과물이 픽셀 단위로 같다.
 */
export function CardPreview({
  card,
  deck,
  resolveSrc,
  width,
  className,
}: CardPreviewProps) {
  const scale = width / CARD_SIZE
  return (
    <div
      className={className}
      style={{ width, height: width, overflow: "hidden", position: "relative" }}
    >
      <div
        style={{
          width: CARD_SIZE,
          height: CARD_SIZE,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <CardFace card={card} deck={deck} resolveSrc={resolveSrc} />
      </div>
    </div>
  )
}

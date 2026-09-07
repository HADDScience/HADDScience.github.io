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

/** 칸별 안내문. 미리보기에서 비어 있는 칸에 회색으로 찍힌다. */
const HINT: Record<string, string> = {
  badge: "chapter 01",
  headline: "제목을 입력하세요",
  big: "큰 문장을 입력하세요",
  subtitle: "부제 (선택)",
  body: "본문을 입력하세요",
  footnote: "각주 (선택)",
  quote: "“인용문을 입력하세요”",
  attrib: "이름 · 직함",
  "cover-title": "카드뉴스",
  "stat-label": "지표 이름",
  "list-title": "항목 제목",
}

/**
 * 텍스트 자리. 비어 있으면 결과물에서는 통째로 사라지고(`is-empty`), 편집기 미리보기에서만
 * 같은 서체·크기의 회색 안내문이 그 자리에 보인다 — 사진 자리와 같은 방식이다.
 * `before` · `after` 는 텍스트에 붙는 간격 div. 텍스트가 없으면 간격도 함께 사라진다.
 */
function Slot({
  className,
  text,
  hint,
  before,
  after,
}: {
  className: string
  text: string | undefined
  hint?: string
  before?: React.ReactNode
  after?: React.ReactNode
}) {
  const empty = !text
  const label = hint ?? HINT[className.split(" ")[0]] ?? ""
  return (
    <div className={empty ? "slot is-empty" : "slot"}>
      {before}
      {empty ? (
        <div className={`${className} placeholder`} data-label={label} />
      ) : (
        <Rich className={className} text={text} />
      )}
      {after}
    </div>
  )
}

type Resolve = ((src: string) => string) | undefined

/** 비율 문자열("4/3")을 사람이 읽는 라벨("4:3")로. 플레이스홀더에 찍힌다. */
const ratioLabel = (ratio: string) => ratio.replace("/", ":")

/**
 * 고정 종횡비 박스 안의 사진. 비율이 달라도 카드 안 위치·영역이 일정하다.
 *
 * 사진이 없으면 빈 상자(`is-empty`)를 그린다. 기본 CSS 는 이 상자를 숨기므로 결과물(PNG · 저장)에는
 * 나오지 않고, 편집기 미리보기(`cn-placeholders`)에서만 점선 자리로 보인다 — 사진을 아직 안 넣었을 때도
 * 레이아웃이 어떻게 생겼는지 알 수 있게.
 */
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
  if (!image?.src) {
    return (
      <div
        className={className ? `imgbox is-empty ${className}` : "imgbox is-empty"}
        style={{ aspectRatio: ratio }}
        data-label={`사진 ${ratioLabel(ratio)}`}
      />
    )
  }
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

/* ---------------------------------------------------------------- 카드 */

function Cover({ card, deck }: { card: Extract<Card, { type: "cover" }>; deck: CardDeck }) {
  return (
    <div className="frame">
      <div className="card">
        <div className="pad col" style={{ height: "100%" }}>
          <div className="grow" />
          {/* eslint-disable-next-line @next/next/no-img-element -- 래스터화 대상이라 최적화 불가 */}
          <img className="cover-logo" src={LOGO_SRC} alt="" draggable={false} />
          <Slot className="cover-title" text={card.title} />
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
          <Slot className="badge" text={card.badge} after={<div className="gap-m" />} />
          <Slot className="quote" text={card.quote} />
          <Slot className="attrib" text={card.attrib} before={<div className="gap-s" />} />
          <div className={card.image?.src ? "slot" : "slot is-empty"}>
            <div className="gap-m" />
            <ImgBox
              image={card.image}
              ratio={card.image?.ratio ?? defaultRatio(card)}
              resolveSrc={resolveSrc}
            />
          </div>
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
          <Slot className="badge" text={card.badge} after={<div className="gap-m" />} />
          <Slot className={hclass} text={card.headline} />
          <Slot className="subtitle" text={card.subtitle} before={<div className="gap-s" />} />
          <div className={card.image?.src ? "slot" : "slot is-empty"}>
            <div className="gap-m" />
            <ImgBox
              image={card.image}
              ratio={card.image?.ratio ?? defaultRatio(card)}
              resolveSrc={resolveSrc}
            />
          </div>
          {/* 상단 정렬 고정, 아래 여백 유동 */}
          <div className="grow" />
          <Slot className="body" text={card.body} />
          <Slot className="footnote" text={card.footnote} before={<div className="gap-s" />} />
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
        <div className={card.image?.src ? "hero" : "hero is-empty"}>
          <ImgBox
            image={card.image}
            ratio={card.image?.ratio ?? defaultRatio(card)}
            resolveSrc={resolveSrc}
          />
        </div>
        <div className="pad col grow" style={{ justifyContent: "center" }}>
          <Slot className="badge" text={card.badge} after={<div className="gap-m" />} />
          <Slot className="headline" text={card.headline} />
          <Slot className="subtitle" text={card.subtitle} before={<div className="gap-s" />} />
          <Slot className="body" text={card.body} before={<div className="gap-m" />} />
          <Slot className="footnote" text={card.footnote} before={<div className="gap-s" />} />
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
          ) : (
            <div
              className={contain ? "split-media contain is-empty" : "split-media is-empty"}
              data-label="세로 사진"
            />
          )}
          <div className="split-body">
            <Slot className="badge" text={card.badge} after={<div className="gap-m" />} />
            <Slot className="headline" text={card.headline} />
            <Slot className="subtitle" text={card.subtitle} before={<div className="gap-s" />} />
            <Slot className="body" text={card.body} before={<div className="gap-m" />} />
            <Slot className="footnote" text={card.footnote} before={<div className="gap-m" />} />
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
          ) : (
            <div className="overlay-empty is-empty" data-label="사진 전체" />
          )}
          <div className="overlay-shade" />
          <div className="overlay-text">
            <Slot className="badge" text={card.badge} />
            <Slot className="headline" text={card.headline} />
            <Slot className="body" text={card.body} before={<div className="gap-s" />} />
            <Slot className="footnote" text={card.footnote} before={<div className="gap-s" />} />
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
          <Slot className="badge" text={card.badge} after={<div className="gap-l" />} />
          <Slot className="big" text={card.headline} />
          <Slot className="body" text={card.body} before={<div className="gap-m" />} />
          <Slot className="footnote" text={card.footnote} before={<div className="gap-l" />} />
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
          <Slot className="badge" text={card.badge} after={<div className="gap-l" />} />
          <Slot className="headline" text={card.headline} after={<div className="gap-l" />} />
          {stats.length > 1 ? (
            <div className="stat-row">
              {stats.map((s, i) => (
                <div className="stat-item" key={i}>
                  <div className="stat-value">
                    <span className={s.value ? undefined : "placeholder"} data-label="00" dangerouslySetInnerHTML={{ __html: richText(s.value) }} />
                    {s.unit ? (
                      <span
                        className="stat-unit"
                        dangerouslySetInnerHTML={{ __html: richText(s.unit) }}
                      />
                    ) : null}
                  </div>
                  <Slot className="stat-label" text={s.label} />
                </div>
              ))}
            </div>
          ) : stats.length === 1 ? (
            <>
              <div className="stat-value">
                <span className={stats[0].value ? undefined : "placeholder"} data-label="00" dangerouslySetInnerHTML={{ __html: richText(stats[0].value) }} />
                {stats[0].unit ? (
                  <span
                    className="stat-unit"
                    dangerouslySetInnerHTML={{ __html: richText(stats[0].unit) }}
                  />
                ) : null}
              </div>
              <Slot className="stat-label" text={stats[0].label} />
            </>
          ) : null}
          <Slot className="body" text={card.body} before={<div className="gap-l" />} />
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
          <Slot className="badge" text={card.badge} after={<div className="gap-m" />} />
          <Slot className="headline sm" text={card.headline} after={<div className="gap-m" />} />
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
                    <Slot className="list-title" text={it.title} />
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
  /** 사진이 없는 자리를 점선 상자로 보여준다. 편집기 미리보기용 — 굽는 무대에서는 끈다. */
  placeholders?: boolean
}

/** 실제 크기(1080×1080)의 카드. 미리보기는 `CardPreview` 로 줄여서 쓴다. */
export function CardFace({ card, deck, resolveSrc, ref, placeholders }: CardFaceProps) {
  return (
    <div className={placeholders ? "cn-root cn-placeholders" : "cn-root"} ref={ref}>
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
  /** 사진이 없는 자리를 점선 상자로. 편집기에서는 켠다. */
  placeholders?: boolean
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
  placeholders,
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
        <CardFace card={card} deck={deck} resolveSrc={resolveSrc} placeholders={placeholders} />
      </div>
    </div>
  )
}

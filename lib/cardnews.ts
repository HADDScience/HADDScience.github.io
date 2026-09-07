import type {
  Card,
  CardDeck,
  CardImageRatio,
  ChapterLayout,
} from "@/content/types"

/**
 * 카드뉴스 덱의 공용 상수와 순수 함수. 편집기(브라우저)와 렌더러가 같이 쓴다.
 * DOM 이나 GitHub 에 닿는 코드는 여기 두지 않는다.
 */

export const CARD_SIZE = 1080

/** 카드 종류 메뉴. 편집기의 "카드 추가" 가 이 순서대로 보여준다. */
export type CardKind = "cover" | "quote" | ChapterLayout

export const CARD_KINDS: {
  kind: CardKind
  label: string
  hint: string
}[] = [
  { kind: "cover", label: "표지", hint: "로고 · 제목 · 버튼. 맨 앞 한 장" },
  { kind: "standard", label: "기본", hint: "제목 · 사진 · 본문. 가장 많이 쓴다" },
  { kind: "image-top", label: "사진 위", hint: "사진이 위를 꽉 채우고 아래에 글" },
  { kind: "split", label: "세로 사진", hint: "왼쪽 세로 사진, 오른쪽 글. 상장·포스터" },
  { kind: "overlay", label: "사진 전체", hint: "사진 위에 글. 강조 컷" },
  { kind: "text", label: "글만", hint: "큰 문장 하나. 도입·전환" },
  { kind: "stat", label: "숫자", hint: "지표 1~3개를 크게" },
  { kind: "list", label: "목록", hint: "항목 나열. 번호·불릿" },
  { kind: "quote", label: "한마디", hint: "인용 + 이름. 마지막 장" },
]

export const RATIO_OPTIONS: { value: CardImageRatio; label: string }[] = [
  { value: "16/9", label: "16:9 넓게" },
  { value: "16/10", label: "16:10" },
  { value: "4/3", label: "4:3 (기본)" },
  { value: "1/1", label: "1:1 정방형" },
  { value: "3/4", label: "3:4 세로" },
]

/** 레이아웃별 사진 박스 기본 비율. 스크립트의 기본값과 같다. */
export function defaultRatio(card: Card): CardImageRatio {
  if (card.type === "quote") return "1/1"
  if (card.type === "chapter" && card.layout === "image-top") return "16/10"
  return "4/3"
}

export function cardKind(card: Card): CardKind {
  return card.type === "chapter" ? card.layout : card.type
}

export function kindLabel(kind: CardKind): string {
  return CARD_KINDS.find((k) => k.kind === kind)?.label ?? kind
}

/** 새 카드. `index` 는 chapter 배지 번호에 쓴다(1부터). */
export function newCard(kind: CardKind, index: number): Card {
  const badge = `chapter ${String(index).padStart(2, "0")}`
  switch (kind) {
    case "cover":
      return { type: "cover", title: "카드뉴스", cta: "haddscience 알아보기" }
    case "quote":
      return {
        type: "quote",
        badge: "대표 한마디 💬",
        quote: "",
        attrib: "허채정 HADD Science 대표",
      }
    case "standard":
      return { type: "chapter", layout: "standard", badge, headline: "", body: "" }
    case "image-top":
      return { type: "chapter", layout: "image-top", badge, headline: "", body: "" }
    case "split":
      return { type: "chapter", layout: "split", badge, headline: "", body: "" }
    case "overlay":
      return { type: "chapter", layout: "overlay", badge, headline: "", body: "" }
    case "text":
      return { type: "chapter", layout: "text", badge: "intro", headline: "", body: "" }
    case "stat":
      return {
        type: "chapter",
        layout: "stat",
        badge,
        headline: "",
        stats: [{ value: "", unit: "", label: "" }],
      }
    case "list":
      return {
        type: "chapter",
        layout: "list",
        badge,
        headline: "",
        marker: "number",
        items: [{ title: "", desc: "" }],
      }
  }
}

/** 빈 덱. 표지 → 기본 한 장 → 한마디. */
export function newDeck(): CardDeck {
  return {
    handle: "@haddscience",
    cards: [newCard("cover", 0), newCard("standard", 1), newCard("quote", 0)],
  }
}

/** `<b>` 만 허용하는 텍스트에서 마크업을 벗겨 낸다. alt · 검색 · 목록용. */
export function plainText(s: string | undefined): string {
  return (s ?? "").replace(/<\/?b>/gi, "").replace(/\s+/g, " ").trim()
}

/**
 * 카드 한 장의 내용을 문장으로 편다. 렌더한 이미지의 alt 가 된다 — 그림 안에 박힌
 * 글자를 스크린리더와 검색엔진이 읽을 수 있는 유일한 통로다.
 */
export function cardText(card: Card, deck: CardDeck): string {
  const join = (...parts: (string | undefined)[]) =>
    parts.map(plainText).filter(Boolean).join(". ")
  switch (card.type) {
    case "cover":
      return join(card.title, card.cta, card.handle || deck.handle)
    case "quote":
      return join(card.badge, card.quote, card.attrib)
    case "chapter":
      switch (card.layout) {
        case "stat":
          return join(
            card.badge,
            card.headline,
            ...card.stats.map((s) => `${s.value}${s.unit ?? ""} ${s.label}`),
            card.body
          )
        case "list":
          return join(
            card.badge,
            card.headline,
            ...card.items.map((it) => join(it.title, it.desc))
          )
        case "text":
        case "overlay":
          return join(card.badge, card.headline, card.body, card.footnote)
        default:
          return join(
            card.badge,
            card.headline,
            card.subtitle,
            card.body,
            card.footnote
          )
      }
  }
}

/** 카드 목록에 보여줄 한 줄 제목. */
export function cardTitle(card: Card): string {
  if (card.type === "cover") return plainText(card.title) || "표지"
  if (card.type === "quote") return plainText(card.quote) || "한마디"
  return plainText(card.headline) || kindLabel(card.layout)
}

/** 덱 안의 사진 경로 전부. 저장할 때 안 쓰는 파일을 걸러 내는 데 쓴다. */
export function deckImageSrcs(deck: CardDeck): string[] {
  const out: string[] = []
  for (const c of deck.cards) {
    if ("image" in c && c.image?.src) out.push(c.image.src)
  }
  return out
}

/**
 * 렌더 결과 파일 경로. 일반 업로드(`ko-NN`)와 구분하려고 `card-NN` 으로 둔다.
 *
 * 카드 안에 글자가 박히므로 언어마다 다른 파일이 나온다. 원문은 접두 없이(`card-01`),
 * 번역은 언어를 끼워(`card-en-01`) 서로 다른 임시 경로가 되게 한다 — 저장할 때 이 경로를
 * 표로 삼아 실제 URL 로 바꾸므로 겹치면 한쪽이 다른 쪽 사진을 가리킨다.
 */
export function cardOutputSrc(postId: string, index: number, lang?: string): string {
  const n = String(index).padStart(2, "0")
  return `/news/${postId}/card-${lang ? `${lang}-` : ""}${n}.webp`
}

/** 편집기에서 고른 원본 사진의 경로. */
export function cardSourceSrc(postId: string, index: number): string {
  return `/news/${postId}/src-${String(index).padStart(2, "0")}.webp`
}

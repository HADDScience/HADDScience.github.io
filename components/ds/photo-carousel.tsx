"use client"

import Image from "next/image"
import * as React from "react"

import { cn } from "@/lib/utils"

export interface CarouselPhoto {
  src: string
  alt: string
  caption: string
  /** 잘리면 안 되는 사진은 contain — 4:3 틀 안에 여백을 두고 통째로 보인다. */
  fit?: "cover" | "contain"
}

export interface CarouselLabels {
  label: string
  prev: string
  next: string
  /** `{n}` 자리에 사진 번호 */
  goTo: string
  /** `{n}` · `{total}` */
  position: string
}

/**
 * 사진 캐러셀. 라이브러리 없이 가로 스크롤 + scroll-snap 으로 만든다.
 *
 * - 넘기기: 좌우 버튼, 아래 점, 키보드 ← → (캐러셀 안에 포커스가 있을 때), 모바일은 손가락으로 밀기.
 *   밀기는 브라우저의 기본 가로 스크롤이 맡으므로 터치 처리 코드를 따로 두지 않는다.
 * - 자동으로 넘기지 않는다. 읽는 중에 사진이 바뀌면 캡션을 놓치고, 멈춤 버튼을 따로 둬야 한다.
 * - `prefers-reduced-motion` 이면 부드러운 스크롤 대신 바로 넘긴다.
 * - 지금 몇 번째인지는 스크롤 위치로 계산한다. 버튼으로 넘기든 손으로 밀든 같은 값을 본다.
 *
 * 크기: PC 에서는 최대 640px, 사진 높이는 화면 높이의 절반 이하(2026-11-24 사용자 의견 — 처음엔 본문 폭
 * 812px 를 꽉 채워 너무 컸다). 모바일은 꽉 찬 폭.
 *
 * 아이콘 세트를 쓰지 않는 디자인시스템 규칙에 따라 버튼은 유니코드 ‹ › 를 쓴다.
 */
export function PhotoCarousel({
  photos,
  labels,
}: {
  photos: CarouselPhoto[]
  labels: CarouselLabels
}) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const [index, setIndex] = React.useState(0)
  const total = photos.length

  const goTo = React.useCallback(
    (i: number) => {
      const track = trackRef.current
      if (!track) return
      const next = Math.max(0, Math.min(total - 1, i))
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      track.scrollTo({ left: next * track.clientWidth, behavior: reduce ? "auto" : "smooth" })
    },
    [total]
  )

  // 스크롤이 멈춘 자리에서 번호를 읽는다. 한 장 폭으로 나눠 반올림하면 손으로 반쯤 민 경우도 맞는다.
  const onScroll = () => {
    const track = trackRef.current
    if (!track || track.clientWidth === 0) return
    const i = Math.round(track.scrollLeft / track.clientWidth)
    if (i !== index) setIndex(i)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      goTo(index + 1)
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      goTo(index - 1)
    }
  }

  const position = labels.position.replace("{n}", String(index + 1)).replace("{total}", String(total))

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.label}
      // 화살표 키는 캐러셀 안 어디에 포커스가 있든(사진 · 버튼 · 점) 받는다. 점을 누른 뒤에도 이어서 넘길 수 있다.
      onKeyDown={onKeyDown}
      // PC 에서는 사진이 본문보다 눈에 띄지 않게 폭을 640px 안으로, 사진 높이(4:3)가 화면 높이의 절반을
      // 넘지 않게 줄인다. 본문 글과 같은 왼쪽 선에 붙인다. 모바일(sm 미만)은 꽉 찬 폭 그대로다.
      className="grid w-full gap-4 sm:max-w-[min(640px,calc(50svh*4/3))]"
    >
      <div className="relative">
        <div
          ref={trackRef}
          tabIndex={0}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-lg [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, i) => (
            <figure
              key={photo.src}
              role="group"
              aria-roledescription="slide"
              aria-label={labels.position.replace("{n}", String(i + 1)).replace("{total}", String(total))}
              className="grid w-full shrink-0 snap-start gap-3"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  // 첫 장만 먼저 받는다. 나머지는 넘길 때 받는다.
                  priority={i === 0}
                  sizes="(min-width: 640px) 640px, 100vw"
                  className={photo.fit === "contain" ? "object-contain" : "object-cover"}
                />
              </div>
              <figcaption className="text-sm text-muted-foreground break-keep">{photo.caption}</figcaption>
            </figure>
          ))}
        </div>

        <ArrowButton side="left" label={labels.prev} disabled={index === 0} onClick={() => goTo(index - 1)} />
        <ArrowButton
          side="right"
          label={labels.next}
          disabled={index === total - 1}
          onClick={() => goTo(index + 1)}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={labels.goTo.replace("{n}", String(i + 1))}
              aria-current={i === index ? "true" : undefined}
              // 점은 작아도 누르는 자리는 24px 를 확보한다.
              className="flex h-6 items-center justify-center"
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-all duration-200 ease-[var(--ease-standard)] motion-reduce:transition-none",
                  i === index ? "w-6 bg-primary" : "w-2 bg-border hover:bg-brand-blue-300"
                )}
              />
            </button>
          ))}
        </div>
        <p className="text-sm font-semibold text-muted-foreground tabular-nums" aria-live="polite">
          {position}
        </p>
      </div>
    </div>
  )
}

function ArrowButton({
  side,
  label,
  disabled,
  onClick,
}: {
  side: "left" | "right"
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        // 사진 위에 얹히므로 채운 흰 바탕을 쓴다(반투명이면 밝은 사진에서 안 보인다).
        "absolute top-[calc((100%-2.25rem)/2)] flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-xl text-foreground shadow-ds-md transition-opacity duration-200 ease-[var(--ease-standard)] hover:text-primary disabled:pointer-events-none disabled:opacity-0",
        side === "left" ? "left-3" : "right-3"
      )}
    >
      <span aria-hidden>{side === "left" ? "‹" : "›"}</span>
    </button>
  )
}

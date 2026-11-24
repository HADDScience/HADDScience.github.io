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
 * 크기와 장수(2026-11-24 사용자 의견 두 번):
 * - 모바일(sm 미만): 1장, 꽉 찬 폭.
 * - 태블릿(sm~lg): 1장, 폭 640px 안 · 사진 높이가 화면 높이의 절반 이하.
 * - PC(lg 이상): 2장을 나란히 놓아 본문 폭을 채운다. 넘기면 1장씩 움직인다. 처음엔 1장이 본문 폭(812px)을
 *   꽉 채워 너무 컸고, 640px 로 줄이니 오른쪽이 애매하게 비었다. 2장이면 한 장이 약 398×298px 다.
 * 몇 장이 보이는지와 한 칸의 폭은 화면에서 잰다(`measure`). 그래서 버튼 · 점 · 밀기 · 「n / 4」가 장수와
 * 상관없이 같은 계산을 쓴다.
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
  /** 맨 왼쪽에 보이는 사진의 번호(0부터). */
  const [index, setIndex] = React.useState(0)
  /** 한 화면에 보이는 장수. 서버와 첫 렌더는 1, 화면 폭을 잰 뒤 PC 면 2. */
  const [visible, setVisible] = React.useState(1)
  const total = photos.length
  const lastIndex = Math.max(0, total - visible)

  /** 한 칸(사진 폭 + 사이 간격)과 보이는 장수. 슬라이드의 실제 위치로 잰다. */
  const measure = React.useCallback(() => {
    const track = trackRef.current
    const slides = track?.children
    if (!track || !slides?.length) return { step: 0, visible: 1 }
    const first = slides[0] as HTMLElement
    const step = slides.length > 1 ? (slides[1] as HTMLElement).offsetLeft - first.offsetLeft : track.clientWidth
    const gap = step - first.offsetWidth
    return { step, visible: step > 0 ? Math.max(1, Math.round((track.clientWidth + gap) / step)) : 1 }
  }, [])

  // 화면 폭이 바뀌면(회전 · 창 크기) 보이는 장수를 다시 잰다.
  React.useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const observer = new ResizeObserver(() => setVisible(measure().visible))
    observer.observe(track)
    return () => observer.disconnect()
  }, [measure])

  const goTo = React.useCallback(
    (i: number) => {
      const track = trackRef.current
      if (!track) return
      const m = measure()
      const next = Math.max(0, Math.min(total - m.visible, i))
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      track.scrollTo({ left: next * m.step, behavior: reduce ? "auto" : "smooth" })
    },
    [measure, total]
  )

  // 스크롤이 멈춘 자리에서 번호를 읽는다. 한 칸 폭으로 나눠 반올림하면 손으로 반쯤 민 경우도 맞는다.
  const onScroll = () => {
    const track = trackRef.current
    const { step } = measure()
    if (!track || step <= 0) return
    const i = Math.round(track.scrollLeft / step)
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

  // 2장이 보이면 「1–2 / 4」 처럼 보이는 범위를 적는다.
  const shown = visible > 1 ? `${index + 1}–${Math.min(total, index + visible)}` : String(index + 1)
  const position = labels.position.replace("{n}", shown).replace("{total}", String(total))

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.label}
      // 화살표 키는 캐러셀 안 어디에 포커스가 있든(사진 · 버튼 · 점) 받는다. 점을 누른 뒤에도 이어서 넘길 수 있다.
      onKeyDown={onKeyDown}
      // PC 에서는 사진이 본문보다 눈에 띄지 않게 폭을 640px 안으로, 사진 높이(4:3)가 화면 높이의 절반을
      // 넘지 않게 줄인다. 본문 글과 같은 왼쪽 선에 붙인다. 모바일(sm 미만)은 꽉 찬 폭 그대로다.
      className="grid w-full gap-4 sm:max-w-[min(640px,calc(50svh*4/3))] lg:max-w-none"
    >
      <div className="relative">
        <div
          ref={trackRef}
          tabIndex={0}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-lg lg:gap-4 [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, i) => (
            <figure
              key={photo.src}
              role="group"
              aria-roledescription="slide"
              aria-label={labels.position.replace("{n}", String(i + 1)).replace("{total}", String(total))}
              className="grid w-full shrink-0 snap-start gap-3 lg:w-[calc((100%-1rem)/2)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  // 처음 보이는 장(PC 는 2장)만 먼저 받는다. 나머지는 넘길 때 받는다.
                  priority={i < 2}
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 640px, 100vw"
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
          disabled={index >= lastIndex}
          onClick={() => goTo(index + 1)}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              // 2장이 보일 때 마지막 점을 누르면 마지막 두 장(3–4)으로 간다.
              onClick={() => goTo(Math.min(i, lastIndex))}
              aria-label={labels.goTo.replace("{n}", String(i + 1))}
              aria-current={i >= index && i < index + visible ? "true" : undefined}
              // 점은 작아도 누르는 자리는 24px 를 확보한다.
              className="flex h-6 items-center justify-center"
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-all duration-200 ease-[var(--ease-standard)] motion-reduce:transition-none",
                  i >= index && i < index + visible ? "w-6 bg-primary" : "w-2 bg-border hover:bg-brand-blue-300"
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

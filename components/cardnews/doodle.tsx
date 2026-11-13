"use client"

import * as React from "react"

import type { CardDoodle, CardDoodleKind, CardDoodleMark } from "@/content/types"

/**
 * 연필로 그린 듯한 낙서(동그라미·화살표·별). 사진 속 우리 제품 칸을 짚는 데 쓴다.
 *
 * 기본은 다 그려진 정지 그림이다 — 편집기 미리보기와 굽는 무대(PNG)는 이 상태를 찍는다.
 * 기사 페이지(`LiveCard`)만 `CardMotion` 을 켜고, 그때는 카드가 화면에 들어올 때 선이
 * 그려지듯 한 번 나타난다(stroke-dashoffset). 움직임 줄이기 설정이면 처음부터 정지 그림.
 *
 * 연필 느낌은 같은 선을 살짝 어긋나게 두 번 긋는 것으로 낸다. 필터를 쓰지 않는 이유:
 * html-to-image 로 구울 때 SVG 필터가 브라우저마다 다르게 나온다.
 */
export const CardMotion = React.createContext(false)

/** 200×200 기준 경로. 모두 손으로 그은 것처럼 조금씩 삐뚤다. */
const SHAPES: Record<CardDoodleKind, string[]> = {
  star: [
    "M100 34 C104 58 109 72 114 80 C130 81 148 82 164 85 C150 96 138 106 128 116 C132 134 136 150 139 166 C125 156 112 147 100 140 C87 149 74 158 61 166 C65 150 69 134 73 117 C62 107 50 97 37 86 C53 82 70 80 86 79 C91 66 96 50 100 34 Z",
    "M174 40 L186 26",
    "M180 64 L196 60",
    "M156 24 L160 8",
  ],
  // 왼쪽 아래에서 오른쪽 위로 휘어 올라가는 화살표. 방향은 rotate 로 돌린다.
  arrow: [
    "M22 178 C46 168 70 150 92 124 C112 100 134 70 170 34",
    "M134 36 C146 34 158 33 171 33 C170 46 168 58 165 70",
  ],
  // 끝이 겹치는 느슨한 동그라미. 상자에 맞춰 타원이 된다.
  circle: [
    "M156 30 C118 6 52 12 22 56 C-2 94 12 152 64 178 C116 200 178 176 192 124 C202 84 182 46 132 24",
  ],
}

/** 기본 자리(문자열 하나만 줬을 때): 카드 오른쪽 위. */
const CORNER: Omit<CardDoodleMark, "kind"> = { x: 79.6, y: 7, w: 13 }

function Mark({ mark, order }: { mark: CardDoodleMark; order: number }) {
  const live = React.useContext(CardMotion)
  const ref = React.useRef<SVGSVGElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!live || !el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // 화면 밖에서 이미 다 그려져 버리지 않게, 카드가 들어올 때 시작한다.
    el.classList.add("is-armed")
    const card = el.closest(".cn-root") ?? el
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("is-drawing")
          io.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    io.observe(card)
    return () => io.disconnect()
  }, [live])

  const stretch = mark.kind === "circle"
  const box: React.CSSProperties = {
    left: `${mark.x}%`,
    top: `${mark.y}%`,
    width: `${mark.w}%`,
    height: `${mark.h ?? mark.w}%`,
    transform: `rotate(${mark.rotate ?? 0}deg)`,
    // 앞 낙서가 다 그려진 뒤에 다음 낙서를 긋는다.
    ["--d" as string]: `${order * 0.75}s`,
  }
  const paths = SHAPES[mark.kind]
  return (
    <svg
      ref={ref}
      className="doodle"
      style={box}
      viewBox="0 0 200 200"
      preserveAspectRatio={stretch ? "none" : "xMidYMid meet"}
      aria-hidden="true"
    >
      {[0, 1].map((pass) =>
        paths.map((d, i) => (
          <path
            key={`${pass}-${i}`}
            d={d}
            pathLength={1}
            className={pass === 0 ? "doodle-line" : "doodle-line ghost"}
            // 모양은 속성으로 둔다 — 굽는 무대(html-to-image)가 SVG 안 CSS 를 놓쳐도 같은 그림.
            fill="none"
            stroke="#F7941D"
            strokeWidth={pass === 0 ? 7 : 3.5}
            strokeOpacity={pass === 0 ? 1 : 0.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            transform={pass === 0 ? undefined : "translate(3 -2)"}
            style={{ "--i": i } as React.CSSProperties}
          />
        )),
      )}
    </svg>
  )
}

export function Doodle({ doodle }: { doodle: CardDoodle }) {
  const marks: CardDoodleMark[] = typeof doodle === "string" ? [{ kind: doodle, ...CORNER }] : doodle
  return (
    <>
      {marks.map((m, i) => (
        <Mark key={i} mark={m} order={i} />
      ))}
    </>
  )
}

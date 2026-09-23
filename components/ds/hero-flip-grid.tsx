"use client"

import { useEffect, useRef, useState } from "react"

import TILES from "@/content/hero-tiles.generated.json"
import {
  advanceRotation,
  CELLS,
  initialRotation,
  ORDER,
} from "@/lib/hero-rotation"

/**
 * 히어로 배경 — 여섯 칸이 한 칸씩 뒤집히며 수상 사진을 돌려 보여주는 플립 그리드.
 *
 * 왜 이렇게 만들었나
 *   요청(2026-09-22)은 "이미지가 플립되면서 여러 이미지 로테이션, 2×3". 한 칸씩만
 *   뒤집는 이유는 여섯 칸이 동시에 돌면 배경이 시선을 빼앗기 때문이다. 2.6초마다
 *   한 칸이 돌아가므로 한 칸은 약 15.6초마다 바뀐다 — 보고 있으면 움직이지만
 *   읽는 동안에는 거의 가만히 있다. 칸 순서는 `ORDER`(인접하지 않게 오간다).
 *
 * 무엇을 띄우나 (2026-09-23 요청: "같은 사진 안 나오도록")
 *   칸마다 사진을 고정해 두지 않는다. 뒤집힐 칸에는 **지금 떠 있는 장면과 겹치지 않는**
 *   사진 중 가장 오래 안 나온 것을 넣는다 — 규칙은 `lib/hero-rotation.ts`, 검사는
 *   `scripts/check-hero-rotation.mjs`(10만 번 뒤집어 확인). 그래서 사진이 어느 칸에든
 *   들어갈 수 있고, 빌드 스크립트는 모든 타일이 제목 아래 칸에 와도 대비가 나오는지 잰다.
 *
 * 격자
 *   데스크톱 3열×2행, 모바일 2열×3행. 둘 다 여섯 칸이고 칸 크기가 모두 같다.
 *   와이드에서 2열×3행으로 두면 칸이 세로로 길어져 무대 사진이 좌우로 잘린다.
 *   타일은 두 벌(`w-*` 와이드 · `p-*` 세로)을 구워 `<picture>` 의 source media 로
 *   가른다. `hidden`/`sm:hidden` 으로 감추면 안 쓰는 쪽도 다운로드된다.
 *
 * 디자인시스템
 *   README 의 "자동 재생 캐러셀 금지"에서 의도적으로 벗어난다. 캐러셀이 금지된 이유는
 *   *읽을 내용*이 자동으로 바뀌어 놓치게 되기 때문인데, 여기서 바뀌는 것은 배경 텍스처
 *   뿐이고 제목·버튼은 고정이다. prefers-reduced-motion 에서는 플립을 걸지 않는다.
 */

/** 한 칸이 도는 간격. 6칸이 한 바퀴 도는 데 15.6초. */
const TICK_MS = 2600

/** 사진 번호(0부터) → 타일 파일. 와이드·세로 두 벌이 같은 번호를 쓴다. */
function tile(prefix: "w" | "p", index: number) {
  return `/hero/tiles/${prefix}-${String(index + 1).padStart(2, "0")}.webp`
}

export function HeroFlipGrid() {
  // 서버와 첫 렌더가 같은 값을 내도록 무작위 없이 정해진 첫 화면에서 시작한다.
  const [rotation, setRotation] = useState(() => initialRotation(TILES))
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")

    let timer: ReturnType<typeof setInterval> | null = null
    // 화면 밖이거나 탭이 숨겨졌으면 돌리지 않는다. 배경 장식 때문에 보이지도 않는
    // 리페인트를 계속 시키는 것은 배터리를 쓰는 일이다.
    let onScreen = true

    const start = () => {
      if (timer) return
      timer = setInterval(() => setRotation((s) => advanceRotation(s, TILES)), TICK_MS)
    }
    const stop = () => {
      if (!timer) return
      clearInterval(timer)
      timer = null
    }
    // 한 번만 보고 끝내지 않는다. 시스템 설정은 세션 중에도 바뀐다.
    const sync = () => {
      if (!reduced.matches && onScreen && document.visibilityState === "visible") start()
      else stop()
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        sync()
      },
      { threshold: 0 }
    )
    if (gridRef.current) io.observe(gridRef.current)
    document.addEventListener("visibilitychange", sync)
    reduced.addEventListener("change", sync)
    sync()

    return () => {
      stop()
      io.disconnect()
      document.removeEventListener("visibilitychange", sync)
      reduced.removeEventListener("change", sync)
    }
  }, [])

  const next = ORDER[rotation.turn % CELLS]

  return (
    <div
      ref={gridRef}
      aria-hidden
      className="absolute inset-0 grid grid-cols-2 grid-rows-3 sm:grid-cols-3 sm:grid-rows-2"
    >
      {rotation.steps.map((step, cell) => {
        const facing = step % 2 === 0
        const [front, back] = rotation.faces[cell]
        return (
          <div key={cell} className="relative overflow-hidden [perspective:1200px]">
            {/* 뒤집을 때마다 180도씩 더한다. 0 ↔ 180 을 오가면 되돌아가는 것처럼 보인다. */}
            <div
              className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(.2,.6,.2,1)] [transform-style:preserve-3d]"
              style={{ transform: `rotateX(${step * 180}deg)` }}
            >
              <Face index={front} priority={facing ? "high" : next === cell ? "auto" : "low"} />
              <Face index={back} priority={!facing ? "high" : next === cell ? "auto" : "low"} back />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Face({
  index,
  back,
  priority,
}: {
  index: number
  back?: boolean
  /** 보이는 면은 high, 다음에 뒤집힐 칸의 뒷면은 auto, 나머지 뒷면은 low. */
  priority: "high" | "auto" | "low"
}) {
  return (
    // 회전과 backface 를 <picture> 에 건다. preserve-3d 는 **직계 자식**에만 적용되므로,
    // 안쪽 <img> 에 걸면 picture 가 평면으로 눌러 버려 뒷면이 3D 로 돌지 않고 사진이
    // 위아래로 뒤집힌 채 그대로 보인다(실측: 첫 플립 뒤 인물이 거꾸로 섰다).
    <picture
      className={
        "absolute inset-0 block [backface-visibility:hidden]" +
        (back ? " [transform:rotateX(180deg)]" : "")
      }
    >
      <source media="(max-width: 639px)" srcSet={tile("p", index)} />
      <img
        src={tile("w", index)}
        alt=""
        width={900}
        height={760}
        fetchPriority={priority}
        decoding="async"
        className="h-full w-full object-cover"
      />
    </picture>
  )
}

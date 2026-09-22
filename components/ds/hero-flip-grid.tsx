"use client"

import { useEffect, useRef, useState } from "react"

/**
 * 히어로 배경 — 여섯 칸이 각자 사진 세 장을 번갈아 보여주는 플립 그리드.
 *
 * 왜 이렇게 만들었나
 *   요청(2026-09-22)은 "이미지가 플립되면서 여러 이미지 로테이션, 2×3". 한 칸씩만
 *   뒤집는 이유는 여섯 칸이 동시에 돌면 배경이 시선을 빼앗기 때문이다. 2.6초마다
 *   한 칸이 돌아가므로 한 칸은 약 15.6초마다 바뀐다 — 보고 있으면 움직이지만
 *   읽는 동안에는 거의 가만히 있다.
 *
 *   칸 순서를 0·4·2·5·1·3 으로 둔 것도 같은 이유다. 왼쪽부터 차례로 돌면 "훑고
 *   지나가는 띠"가 되어 시선이 따라간다.
 *
 * 격자
 *   데스크톱 3열×2행, 모바일 2열×3행. 둘 다 여섯 칸이고 타일도 여섯 칸 몫만 받는다.
 *   와이드에서 2열×3행으로 두면 칸이 세로로 길어져 무대 사진이 좌우로 잘린다.
 *   타일은 두 벌(`w-*` 와이드 · `p-*` 세로)을 구워 `<picture>` 의 source media 로
 *   가른다. `hidden`/`sm:hidden` 으로 감추면 안 쓰는 쪽도 다운로드된다.
 *
 * 디자인시스템
 *   README 의 "자동 재생 캐러셀 금지"에서 의도적으로 벗어난다. 캐러셀이 금지된 이유는
 *   *읽을 내용*이 자동으로 바뀌어 놓치게 되기 때문인데, 여기서 바뀌는 것은 배경 텍스처
 *   뿐이고 제목·버튼은 고정이다. prefers-reduced-motion 에서는 플립을 걸지 않는다.
 */

/** 한 칸이 도는 사진 수. `scripts/build-hero-tiles.mjs` 의 TILES_PER_CELL 과 같아야 한다. */
const PER_CELL = 3
const CELLS = 6
/** 한 칸이 도는 간격. 6칸이 한 바퀴 도는 데 15.6초. */
const TICK_MS = 2600
/** 칸이 도는 차례. 인접하지 않은 칸을 오가 "훑고 지나가는" 느낌을 없앤다. */
const ORDER = [0, 4, 2, 5, 1, 3]

/** 칸 i 의 n 번째 사진 파일 이름. 와이드·세로 두 벌이 같은 번호를 쓴다. */
function tile(prefix: "w" | "p", cell: number, n: number) {
  return `/hero/tiles/${prefix}-${String(cell * PER_CELL + n + 1).padStart(2, "0")}.webp`
}

export function HeroFlipGrid() {
  /** 칸마다 지금까지 뒤집힌 횟수. 보이는 면과 보이는 사진이 여기서 계산된다. */
  const [steps, setSteps] = useState<number[]>(() => Array(CELLS).fill(0))
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")

    let timer: ReturnType<typeof setInterval> | null = null
    let turn = 0
    // 화면 밖이거나 탭이 숨겨졌으면 돌리지 않는다. 배경 장식 때문에 보이지도 않는
    // 리페인트를 계속 시키는 것은 배터리를 쓰는 일이다.
    let onScreen = true

    const start = () => {
      if (timer) return
      timer = setInterval(() => {
        const cell = ORDER[turn % CELLS]
        turn++
        setSteps((prev) => prev.map((s, i) => (i === cell ? s + 1 : s)))
      }, TICK_MS)
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

  return (
    <div
      ref={gridRef}
      aria-hidden
      className="absolute inset-0 grid grid-cols-2 grid-rows-3 sm:grid-cols-3 sm:grid-rows-2"
    >
      {steps.map((step, cell) => {
        // 뒤집을 때마다 180도씩 더한다. 0 ↔ 180 을 오가면 되돌아가는 것처럼 보인다.
        const facing = step % 2 === 0
        // 앞면은 짝수 걸음, 뒷면은 홀수 걸음의 사진을 든다. `step % PER_CELL` 을 두 면에
        // 그대로 쓰면, 회전 **전반부에 아직 보이고 있는 면**의 사진이 그 순간 새 사진으로
        // 갈려서 톡 튄다. 면마다 자기 차례의 사진만 들게 하면 그 일이 없고, 다음에 보일
        // 사진은 회전이 끝나기 전에 미리 받아 둔 상태가 된다.
        const frontIdx = (facing ? step : step - 1) % PER_CELL
        const backIdx = (facing ? step + 1 : step) % PER_CELL
        return (
          <div key={cell} className="relative overflow-hidden [perspective:1200px]">
            <div
              className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(.2,.6,.2,1)] [transform-style:preserve-3d]"
              style={{ transform: `rotateX(${step * 180}deg)` }}
            >
              <Face src={frontIdx} cell={cell} eager={facing} />
              <Face src={backIdx} cell={cell} eager={!facing} back />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Face({
  cell,
  src,
  back,
  eager,
}: {
  cell: number
  src: number
  back?: boolean
  eager: boolean
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
      <source media="(max-width: 639px)" srcSet={tile("p", cell, src)} />
      <img
        src={tile("w", cell, src)}
        alt=""
        width={900}
        height={760}
        // 첫 화면에 보이는 면은 바로 받는다. 뒷면은 15초 뒤에야 보이므로 급하지 않다.
        fetchPriority={eager ? "high" : "low"}
        decoding="async"
        className="h-full w-full object-cover"
      />
    </picture>
  )
}

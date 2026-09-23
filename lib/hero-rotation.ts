/**
 * 히어로 플립 그리드가 칸마다 무엇을 띄울지 정한다. 화면(`components/ds/hero-flip-grid.tsx`)
 * 과 떼어 둔 이유는 규칙을 시뮬레이션으로 검사하기 위해서다 — "같은 장면이 두 칸에 동시에
 * 뜨지 않는다"는 눈으로 몇 분 봐서는 증명되지 않는다(`scripts/check-hero-rotation.mjs`).
 *
 * 규칙
 *   1. 한 번에 한 칸만 뒤집는다. 차례는 `ORDER`.
 *   2. 뒤집힐 칸의 뒷면에는 **뒤집기 한 박자 전에** 사진을 넣어 둔다. 회전이 시작될 때
 *      이미 받아진 상태라야 빈 면이 보이지 않는다.
 *   3. 그 사진은 **지금 떠 있는 여섯 장 어느 것과도 장면이 다른 것** 중에서, 가장 오래
 *      안 나온 것을 고른다. 떠 있는 것에는 뒤집힐 칸 자신도 들어가므로, 뒤집었는데 같은
 *      장면이 나오는 일도 없다.
 *
 *   미리 넣어 둔 사진이 뒤집히기 전에 다른 칸에 먼저 뜰 수는 없다 — 그 사이에 뒤집히는
 *   칸이 없다(규칙 1). 그래서 예약은 한 번에 하나면 충분하고, 장면은 7개(떠 있는 6 + 다음 1)
 *   이상이면 된다. 빌드 스크립트가 그 수를 확인한다.
 */

export interface HeroTile {
  /** 같은 값끼리는 동시에 뜨지 않는다. 연사·같은 백드롭처럼 흐리면 구별이 안 되는 묶음. */
  scene: string
}

export const CELLS = 6

/**
 * 칸이 도는 차례. 인접하지 않은 칸을 오가 "훑고 지나가는 띠"처럼 보이지 않게 한다.
 * 데스크톱(3열×2행)에서 0·4·2·5·1·3 은 좌상 → 가운데 아래 → 우상 → 우하 → 가운데 위 → 좌하.
 */
export const ORDER = [0, 4, 2, 5, 1, 3] as const

export interface RotationState {
  /** 지금까지 몇 번 뒤집었나. 다음에 뒤집을 칸은 `ORDER[turn % CELLS]`. */
  turn: number
  /** 칸마다 뒤집힌 횟수. 짝수면 앞면, 홀수면 뒷면이 보인다. */
  steps: number[]
  /** 칸마다 [앞면 사진, 뒷면 사진] — `tiles` 의 번호. */
  faces: [number, number][]
  /** 사진마다 마지막으로 화면에 뜬 차례. 한 번도 안 떴으면 -1. */
  lastShown: number[]
}

export function visibleTile(state: RotationState, cell: number): number {
  return state.steps[cell] % 2 === 0 ? state.faces[cell][0] : state.faces[cell][1]
}

/**
 * 떠 있는 장면을 피해 가장 오래 안 나온 사진. 동률이면 번호가 작은 쪽 — 서버와 브라우저가
 * 같은 순서를 내야 하므로 무작위를 쓰지 않는다.
 */
function pickNext(state: RotationState, tiles: readonly HeroTile[]): number {
  const showing = new Set<string>()
  const showingIds = new Set<number>()
  for (let c = 0; c < CELLS; c++) {
    const t = visibleTile(state, c)
    showing.add(tiles[t].scene)
    showingIds.add(t)
  }

  let best = -1
  for (let i = 0; i < tiles.length; i++) {
    if (showing.has(tiles[i].scene)) continue
    if (best === -1 || state.lastShown[i] < state.lastShown[best]) best = i
  }
  if (best !== -1) return best

  // 장면이 7개 미만이면 여기로 온다(빌드 스크립트가 막지만). 그때도 **같은 파일**만은 피한다.
  for (let i = 0; i < tiles.length; i++) if (!showingIds.has(i)) return i
  return visibleTile(state, ORDER[state.turn % CELLS])
}

/** 뒤집힐 칸의, 지금 보이지 않는 면에 사진을 넣는다. */
function prepare(state: RotationState, tiles: readonly HeroTile[]): RotationState {
  const cell = ORDER[state.turn % CELLS]
  const hidden = state.steps[cell] % 2 === 0 ? 1 : 0
  const faces = state.faces.map((f) => [...f] as [number, number])
  faces[cell][hidden] = pickNext(state, tiles)
  return { ...state, faces }
}

/**
 * 첫 화면. 앞의 여섯 장이 순서대로 칸 0~5 에 뜬다(빌드 스크립트가 여섯 장의 장면이 서로
 * 다르다는 것을 확인한다). 서버에서도 같은 값을 내야 하이드레이션이 어긋나지 않는다.
 */
export function initialRotation(tiles: readonly HeroTile[]): RotationState {
  const faces = Array.from({ length: CELLS }, (_, c) => [c, c] as [number, number])
  const lastShown = tiles.map((_, i) => (i < CELLS ? 0 : -1))
  return prepare({ turn: 0, steps: Array(CELLS).fill(0), faces, lastShown }, tiles)
}

/** 한 칸을 뒤집고, 다음에 뒤집힐 칸의 뒷면을 채운다. */
export function advanceRotation(state: RotationState, tiles: readonly HeroTile[]): RotationState {
  const cell = ORDER[state.turn % CELLS]
  const steps = [...state.steps]
  steps[cell] += 1
  const lastShown = [...state.lastShown]
  const flipped: RotationState = { ...state, steps, lastShown, turn: state.turn + 1 }
  lastShown[visibleTile(flipped, cell)] = flipped.turn
  return prepare(flipped, tiles)
}

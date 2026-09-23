/**
 * 히어로 플립 그리드의 규칙을 실제 사진 목록으로 오래 돌려 검사한다.
 *
 *   node scripts/check-hero-rotation.mjs
 *
 * 화면에서 몇 분 지켜보는 것으로는 "같은 장면이 두 칸에 동시에 뜨지 않는다"를 알 수 없다.
 * 여섯 칸 · 17장 · 가장 오래 안 나온 것 우선이면, 드문 조합은 수십 바퀴 뒤에야 나온다.
 * 그래서 10만 번 뒤집어 매번 확인한다. 사진 목록을 바꾸면 다시 돌린다.
 */
import tiles from "../content/hero-tiles.generated.json" with { type: "json" }
// Node 24 는 .ts 를 그대로 읽는다(타입만 걷어낸다). 그래서 화면이 쓰는 규칙 파일을
// 복사하지 않고 그대로 불러 검사한다.
import {
  advanceRotation,
  CELLS,
  initialRotation,
  ORDER,
  visibleTile,
} from "../lib/hero-rotation.ts"

const TURNS = 100_000

function visibleScenes(s) {
  return Array.from({ length: CELLS }, (_, c) => tiles[visibleTile(s, c)].scene)
}

let state = initialRotation(tiles)
const shownCount = new Array(tiles.length).fill(0)
let longestGap = 0
const lastSeen = new Array(tiles.length).fill(0)
const failures = []

const check = (s, when) => {
  const scenes = visibleScenes(s)
  if (new Set(scenes).size !== CELLS) failures.push(`${when}: 같은 장면이 동시에 떠 있다 — ${scenes.join(", ")}`)
}

check(state, "첫 화면")
for (let t = 0; t < TURNS && failures.length < 5; t++) {
  const cell = ORDER[state.turn % CELLS]
  const before = tiles[visibleTile(state, cell)].scene
  // 뒤집기 전, 이 칸의 뒷면은 이미 채워져 있어야 한다(한 박자 전에 넣어 둔다).
  const hiddenBefore = state.steps[cell] % 2 === 0 ? state.faces[cell][1] : state.faces[cell][0]

  state = advanceRotation(state, tiles)

  const now = visibleTile(state, cell)
  if (now !== hiddenBefore) failures.push(`${t}번째: 미리 넣어 둔 사진(${hiddenBefore})이 아니라 ${now} 가 떴다`)
  if (tiles[now].scene === before) failures.push(`${t}번째: 칸 ${cell} 이 뒤집혔는데 같은 장면(${before})이다`)
  check(state, `${t}번째`)

  shownCount[now]++
  if (t - lastSeen[now] > longestGap && lastSeen[now] > 0) longestGap = t - lastSeen[now]
  lastSeen[now] = t
}

if (failures.length) {
  console.error(`실패 ${failures.length}건`)
  for (const f of failures) console.error("  ✗ " + f)
  process.exit(1)
}

const scenes = new Set(tiles.map((t) => t.scene))
console.log(`사진 ${tiles.length}장 · 장면 ${scenes.size}개 · ${TURNS.toLocaleString()}번 뒤집기`)
console.log("  ✓ 모든 순간 여섯 칸의 장면이 서로 다르다")
console.log("  ✓ 뒤집힐 때마다 장면이 바뀐다")
console.log("  ✓ 뒤집히는 면에는 한 박자 전에 넣어 둔 사진이 뜬다")
const min = Math.min(...shownCount)
const max = Math.max(...shownCount)
console.log(`  사진별 노출 ${min.toLocaleString()} ~ ${max.toLocaleString()}회 · 한 사진이 다시 뜨기까지 최장 ${longestGap}번(${((longestGap * 2.6) / 60).toFixed(1)}분)`)

"use client"

import * as React from "react"

/**
 * 1초마다 바뀌는 현재 시각. 마감 카운트다운과 「모집 중/마감」 판단에 쓴다.
 *
 * 하이드레이션 경고를 피하는 방법: `useSyncExternalStore` 의 서버 스냅샷으로 **서버가 렌더할 때 쓴 값**
 * (`serverNow`)을 돌려준다. 서버 렌더와 브라우저의 첫 렌더(하이드레이션)가 같은 값으로 그려지고,
 * 하이드레이션이 끝난 직후 React 가 브라우저 시계로 다시 그린다. `serverNow` 를 null 로 주면 첫 렌더가
 * 시각을 모르는 상태로 그려진다 — 카운트다운처럼 서버 시각으로 그리면 틀린 숫자가 잠깐 보이는 곳에 쓴다.
 *
 * 시계는 모듈에 하나만 둔다. 한 화면에 이 훅을 쓰는 컴포넌트가 여럿이어도 타이머는 하나다.
 */
let now = 0
let timer: ReturnType<typeof setInterval> | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (timer === null) {
    now = Date.now()
    timer = setInterval(() => {
      now = Date.now()
      listeners.forEach((l) => l())
    }, 1000)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }
}

/**
 * 같은 렌더 안에서 여러 번 불려도 같은 값을 줘야 한다(React 가 어긋나면 경고하고 다시 그린다).
 * 그래서 여기서 시계를 읽지 않고 저장된 값만 준다. 값은 `subscribe` 가 구독을 시작할 때 새로 읽고,
 * React 는 구독 직후 스냅샷을 한 번 더 확인하므로 오래된 값이 남지 않는다.
 */
function getSnapshot() {
  if (now === 0) now = Date.now()
  return now
}

export function useNow(serverNow: number | null): number | null {
  return React.useSyncExternalStore<number | null>(subscribe, getSnapshot, () => serverNow)
}

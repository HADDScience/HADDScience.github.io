"use client"

import * as React from "react"

/**
 * NavReveal — 스크롤 스테이지 위에서는 네비를 투명하게 얹고, 스테이지를 지나면 평소 모습으로 돌린다.
 *
 * 왜 이 컴포넌트가 따로 있는가
 *   네비는 레이아웃에 있어 모든 페이지가 공유한다. 상태를 NavBar 안의 state 로 두면
 *   페이지 이동 때 값이 남아 다른 페이지에서도 투명해질 수 있다. 그래서 **스테이지가
 *   있는 페이지에만 이 컴포넌트를 두고**, 마운트되어 있는 동안만 body 에 속성을 건다.
 *   언마운트되면 속성을 지우므로 다른 페이지는 영향을 받지 않는다.
 *
 *   React state 대신 body 의 data 속성을 직접 만지는 이유는, 이것이 바로 effect 가
 *   담당해야 하는 "외부 시스템과의 동기화" 이기 때문이다. state 를 두면 effect 안에서
 *   setState 를 호출하게 되고(리렌더 연쇄) 실제로 lint 규칙에도 걸린다.
 *
 * ★ 관찰 대상은 반드시 **스테이지 전체**여야 한다 (얇은 센티넬이면 안 된다)
 *   처음에는 스테이지 끝에 1px 센티넬을 두고 관찰했는데, 맨 아래에서 맨 위로 한 번에
 *   점프하면 네비가 투명 상태로 돌아가지 않았다. IntersectionObserver 는 교차 상태가 *바뀔 때만* 발화한다.
 *   1px 센티넬은 "루트 위에 있음"과 "루트 아래에 있음" 모두 비교차 상태라, 그 사이의
 *   교차 구간을 건너뛰면 콜백이 한 번도 불리지 않는다.
 *   스테이지는 화면보다 높으므로 구간 안에서 항상 교차한다 → 모든 전환이 상태 변화가 되어
 *   빠른 스크롤·앵커 점프에서도 놓치지 않는다.
 */
export function NavReveal({
  /** 스크롤 스테이지 섹션의 id. 화면보다 높은 요소여야 한다. */
  stageId,
  /** 스티키 헤더 높이(px). 스테이지 끝이 헤더 아래로 들어오는 순간 전환한다. */
  headerHeight = 76,
}: {
  stageId: string
  headerHeight?: number
}) {
  React.useEffect(() => {
    const stage = document.getElementById(stageId)
    const body = document.body

    // 스테이지가 없는 페이지에서는 아무것도 하지 않는다.
    if (!stage) return

    body.dataset.navOverHero = "true"

    const observer = new IntersectionObserver(
      ([entry]) => {
        body.dataset.navOverHero = entry.isIntersecting ? "true" : "false"
      },
      // 루트 상단을 헤더 높이만큼 잘라, 스테이지 끝이 헤더에 닿을 때 네비가 나타나게 한다.
      { rootMargin: `-${headerHeight}px 0px 0px 0px`, threshold: 0 }
    )

    observer.observe(stage)

    return () => {
      observer.disconnect()
      delete body.dataset.navOverHero
    }
  }, [stageId, headerHeight])

  return null
}

---
kind: snapshot
status: active
canonical: mydocs/working/2026-09-09-nav-narrow-overflow.md
last_verified: 2026-09-09
---

# 2026-09-09 — 좁은 화면에서 헤더가 화면 밖으로 나가던 것 · 작업 결과

Omnis 쪽에서 "시스템 글꼴·화면 크기를 키우면 반응형이 어떻게 되나"를 재던 기준을
이 저장소에도 그대로 적용했다. Omnis 의 CSS 를 옮겨 온 것이 아니다 — 여기엔
`font-size: 13px` 도 `--ui-zoom` 도 없어 해당 사항이 없다. **같은 실측을 돌려 나온
것만 고쳤다.**

Omnis 쪽 기록: `omnis-local/mydocs/working/2026-09-09-narrow-viewport-and-inventory.md`

## 커밋 · 배포

| | |
|---|---|
| 커밋 | `fcb7d38` |
| 배포 | `haddscience-4zp2cxkoe` (production, Ready, 46s) — main 푸시 자동 배포 |

## 왜 — 시스템 설정이 웹에 닿는 형태

안드로이드 시스템 글꼴 크기는 Chrome 웹 콘텐츠에 적용되지 않는다. 대신 Chrome 의
기본 확대/축소(50~200%)와 시스템 화면 크기(디스플레이 크기)가 **CSS 뷰포트를 좁힌다.**
그래서 "글씨를 키웠다"는 웹에서 "폭이 좁아졌다"로 도착한다. 320px 아래까지 견디면 된다.

## 실측 — 11개 경로 × 390 · 320 · 280 · 200px

### 전 — 모든 경로가 같은 값으로 넘쳤다

```
390px  overflow=0
320px  overflow=47    ← 11개 경로 전부
280px  overflow=107   ← 11개 경로 전부
200px  overflow=167   ← 11개 경로 전부
```

모든 페이지가 같은 값이라는 것이 단서였다. 페이지 콘텐츠가 아니라 **모든 페이지가
공유하는 헤더 한 줄**이 원인이다. 320+47 = 200+167 = 367px — 헤더가 367px 아래로
줄지 못했다.

### 원인 네 가지

| | |
|---|---|
| `<Container className="flex h-19 items-center gap-10">` | 로고와 오른쪽 묶음 사이 40px 이 좁은 화면에도 그대로 |
| 로고 링크가 `shrink-0` | 183px 고정. 줄지 못하고 헤더를 밀어냈다 |
| Container 기본 `px-6` | 좌우 48px |
| 햄버거 `size-10` | 40px — 터치 타깃 하한 미달 |

### 후

```
390px  overflow=0   11개 경로 전부
320px  overflow=0   11개 경로 전부
280px  overflow=0   11개 경로 전부
200px  overflow 20~43px  5개 경로 (홈 · 회사소개 · 제품 · 라이브젤 · 자료실 · 문의)
```

`gap-3 lg:gap-10` / 로고 `min-w-0` + 좁은 화면 `h-6` / 헤더만 `px-4 sm:px-6` /
햄버거 44px.

Container 의 기본 패딩은 건드리지 않았다 — 사이트 전체의 여백이 바뀐다. 헤더에서만
`className` 으로 덮었다.

### 배포본에서 다시 쟀다

로컬이 아니라 `https://haddscience.vercel.app` 을 직접 열어서:

```
320px  11개 경로 전부  overflow=0
280px  11개 경로 전부  overflow=0
```

전 경로 HTTP: `/ko` `/ko/about` `/ko/about/team` `/ko/about/location` `/ko/products`
`/ko/products/livegel` `/ko/news` `/ko/library` `/ko/contact` `/ko/privacy`
`/ko/terms` `/en` — 전부 200.

## 남은 것

- **200px 잔여 20~43px.** 공유 `Button` 의 `shrink-0` 과 자료실 로고 문자열
  (`HADD:Library`)이다. 고치려면 디자인 시스템을 건드려야 한다. 실기기 하한
  (폴드 접힘 + 화면 크기 최대 ≈ 280px)은 넘겼다
- **터치 타깃이 44px 미만인 것이 더 있다.** 언어 토글 68×32, "자세히 보기 →" 79×20,
  푸터 링크 342×20. 본문 텍스트 링크에 44px 을 강제하면 디자인이 바뀌므로 이번엔
  햄버거만 올렸다
- 홈 화면의 로고 마퀴가 측정 스크립트에서 `bleed` 로 잡힌다. 부모가
  `overflow-hidden` 이라 문서 폭에는 기여하지 않는다(페이지 overflow 가 0인 것이 증거).
  스크립트가 `overflow: auto/scroll` 부모만 제외하고 `hidden` 은 안 걸러서 생기는 오탐
- ~~`AGENTS.md:68` 이 `README.md` 와 어긋난다~~ — 고쳤다. "Vercel 은 git 푸시로 자동
  배포되지 않는다" 가 남아 있었는데, 2026-09-08 부터 main 푸시가 곧 배포다.
  `vercel deploy` 가 커밋하지 않은 것까지 올린다는 경고도 같이 넣었다

---
kind: snapshot
status: active
canonical: mydocs/working/2026-09-21-admin-list-overflow.md
last_verified: 2026-09-21
---

# 2026-09-21 — 관리 화면 목록이 오른쪽으로 삐져나가던 것 · 작업 결과

`/admin` 의 하드:라이브러리 목록이 검색창·버튼보다 넓게 그려져 오른쪽이 화면 밖으로
나갔다. 같은 원인이 편집기 상단 바에도 있었다.

같은 갈래의 앞선 기록: [2026-09-09 좁은 화면 헤더 넘침](2026-09-09-nav-narrow-overflow.md).
그쪽은 `shrink-0` 이 범인이었고 이번은 **min-width 의 자동값**이다.

## 커밋 · 배포

| | |
|---|---|
| PR | [#4](https://github.com/HADDScience/HADDScience.github.io/pull/4) — rebase 머지 |
| 커밋 | `a89fc6c` |
| 배포 | main 푸시 자동 배포, Vercel `success` |

## 원인 — 그리드 항목의 min-width 는 `auto` 다

```
ul.grid                     칸 너비 = 컨테이너 너비 (1104px)
└ li.flex                   그리드 항목 → min-width: auto
   ├ 썸네일 (shrink-0 64px)
   ├ button.min-w-0.flex-1
   │   └ p.truncate         white-space: nowrap
   └ 아이콘 둘 (36px)
```

`li` 의 최소 너비는 그 안 flex 줄의 min-content 이고, 제목 `<p>` 가 `truncate`
(= `white-space: nowrap`)라 **제목 한 줄 전체 너비**가 그대로 최소 너비가 된다.
안쪽 `<button>` 의 `min-w-0` 은 flex **레이아웃**에서 줄여 주기는 해도 min-content
**계산**에는 쓰이지 않는다. 그래서 칸보다 넓은 `li` 가 그려진다.

그리드 칸은 모든 줄이 공유하므로 **제목이 긴 글 한 건이 목록 전체를 밀어낸다.**
화면에 보이는 줄이 전부 같은 폭으로 넓어진 것이 단서였다 — 한 줄만 이상하면 그 줄의
내용 문제지만, 전부 같으면 공유하는 칸이 원인이다.

고치는 법은 `li` 에도 `min-w-0` 을 주는 것. 칸 너비까지 줄어들고, 그 안에서 제목이
원래 의도대로 말줄임된다.

## 진단에서 헛디딘 것

단순 재현을 세 번 만들었는데 전부 넘치지 않았다.

| 세운 가설 | 결과 |
|---|---|
| `grid` 에 `grid-cols-1`(=`minmax(0,1fr)`)이 없어서 | 기각 — 트랙은 컨테이너 폭으로 잘 잠긴다 |
| `<button>` 요소의 고유 너비 계산이 달라서 | 기각 — `<div>` 로 바꿔도 같다 |
| 운영 CSS 가 로컬과 달라서 | 기각 — 배포본 CSS 를 받아 붙여도 안 넘친다 |

넘치지 않은 진짜 이유는 **재현용 제목이 컨테이너보다 짧아서**였다. 제목이 칸 안에
들어가면 압력이 아예 걸리지 않는다. 제목을 네 배로 늘리자 한 번에 재현됐다.

> 넘침을 재현할 때는 넘칠 만큼 긴 내용을 넣었는지부터 본다. "구조를 똑같이 옮겼는데
> 재현이 안 된다"는 대개 내용이 임계값 아래라는 뜻이다.

## 실측

Omnis API 를 목킹한 Playwright 로 실제 `/admin` 을 띄워 쟀다(뷰포트 1700px ·
컨테이너 1104px, 긴 제목 한 건 포함).

```
전   ul 1104   li 1341    → 237px 초과, document.scrollWidth > 뷰포트
후   ul 1104   li 1104    → 초과 없음, 긴 제목만 말줄임(…)
```

편집기 상단 바(`grid` 항목 + `truncate` 제목, 같은 구조)는 같은 조건에서
`2085 → 1152`(`-mx-6` 포함).

배포 뒤 `https://haddscience.com/admin/` 에서 다시:

```
main 1152   ul 1104   li 1104 · 1104
document.scrollWidth 1700 = 뷰포트   → 가로 스크롤 없음
```

## 고친 곳

| 파일 | 변경 |
|---|---|
| `app/admin/page.tsx` | 목록 `li` 에 `min-w-0` (+ 왜 필요한지 주석) |
| `components/admin/post-editor.tsx` | sticky 상단 바에 `min-w-0` |
| `components/admin/deck-editor.tsx` | sticky 상단 바에 `min-w-0` |

## 남은 것

- **목록 정렬.** 하드:라이브러리 목록에서 `2025.11.12` 글이 `2026.08.05` 와
  `2026.06.20` 사이에 있다. 목록 순서는 날짜가 아니라 `position` 이므로 그 자체로
  버그가 아닐 수 있다 — 확인하지 않았다.
- **같은 구조가 더 있는지 전수로 보지 않았다.** `truncate` 를 쓰는 자리 네 곳 중
  둘(편집기 상단 바)은 고쳤고, 덱 편집기의 카드 목록은 안쪽 `min-w-0` 이 제자리에
  있어 같은 조건에서 넘치지 않는 것을 확인했다. 공개 사이트 쪽은 보지 않았다.

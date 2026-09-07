---
kind: snapshot
status: active
canonical: mydocs/plans/2026-09-07-cardnews-rebuild.md
last_verified: 2026-09-07
---

# 2026-09-07 — 카드뉴스 재작성: 검사 페이지 · 편집기 자동 영문

계획서는 [`mydocs/plans/2026-09-07-cardnews-rebuild.md`](../plans/2026-09-07-cardnews-rebuild.md).
아래는 돌린 명령과 그 출력이다.

## 환경

- 브랜치 `feat/cardnews-rebuild`
- 개발 서버 `rm -rf .next && OMNIS_API_BASE=http://localhost:3000/api/website pnpm dev -p 3123`
- Playwright 는 MCP 가 아니라 `/Users/jeong-uchang/work/omnis-local/node_modules/playwright` 를
  임포트하는 node 스크립트로 돌렸다 (`chromium.launch({ channel: "chrome" })`).

## 1. 검사 페이지 `/admin/lint/`

`app/admin/lint/page.tsx`. 덱 JSON 을 넣으면 카드를 원본 크기(1080)로 그리고 카드마다
`lintCard` 결과를 붙인다. 자동화는 `window.__cardnews` (`load` · `png` · `count`).

검사 덱은 카드 3장(cover · standard · quote)이고, standard 본문 끝을
`"…찾아갔습니\n다"` 로 만들어 고아 줄을 일부러 심었다.

```
$ node scratchpad/agentB/lint-page.mjs
window.__cardnews 존재: true
issues 길이: 3 (카드 수 3 )
[
  [
    {
      "kind": "orphan",
      "label": "표지 제목",
      "message": "표지 제목의 마지막 줄에 \"엄\" 만 남았습니다 — 문장을 고치거나 줄바꿈을 옮기세요."
    }
  ],
  [
    {
      "kind": "orphan",
      "label": "본문",
      "message": "본문의 마지막 줄에 \"다\" 만 남았습니다 — 문장을 고치거나 줄바꿈을 옮기세요."
    }
  ],
  []
]
count(): 3
png(1) prefix: data:image/png;base64,
png(1) 크기: 1080x1080
카드 2 화면 텍스트:
  | 2 / 3 · CHAPTER · STANDARD
  |
  | CHAPTER 01
  | 🎤 연구실을 찾아갔습니다
  | 허채정 대표가 부산대학교 나노과학기술대학을 찾아갔습니
  | 다
  | 본문의 마지막 줄에 "다" 만 남았습니다 — 문장을 고치거나 줄바꿈을 옮기세요.
줄바꿈을 고친 뒤 issues: [[{"kind":"orphan","label":"표지 제목","message":"표지 제목의 마지막 줄에 \"엄\" 만 남았습니다 — 문장을 고치거나 줄바꿈을 옮기세요."}],[],[]]
```

- `load` 는 카드 수(3)만큼 배열을 돌려준다.
- 심어 둔 고아 줄이 2번 카드에서 잡히고, 본문 줄바꿈을 고치면 사라진다.
- 표지의 `"엄"` 은 심은 것이 아니라 실제 조판 문제다 — 제목이 세 줄로 접히며 마지막 줄에 한 글자가 남는다.
  검사가 화면과 같은 DOM 을 읽고 있다는 뜻이기도 하다.
- `png(1)` 은 `data:image/png;base64,` 로 시작하고 1080×1080.

화면 캡처: `scratchpad/agentB/lint-page.png` (표지 카드가 원본 크기로 그려지고 왼쪽에 JSON 칸).

품질 게이트:

```
$ pnpm typecheck && pnpm lint
> tsc --noEmit
> eslint
(출력 없음 — 오류 0)
```

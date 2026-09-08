---
kind: snapshot
status: active
canonical: mydocs/plans/archives/2026-09-07-cardnews-rebuild.md
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

## 2. 편집기 자동 영문 카드

`components/admin/deck-editor.tsx` · `lib/admin-posts.ts` · `lib/cardnews.ts`.

저장 흐름: 원문 덱을 굽는다 → `POST /translate` → 돌아온 영문 덱을 **한 번 더 굽는다** →
영문 카드 webp 를 업로드 목록에 넣고 `content.en` 을 그 이미지 블록으로 채운다.
`post.deck` 에는 원문 덱만 저장한다.

- 무대(`ExportStage`)가 덱을 인자로 받게 고쳤다. 카드 수가 같으면 React 가 DOM 을
  재사용해 두 번째 덱의 노드를 못 잡으므로 무대를 `id` key 로 통째로 다시 세운다.
- 카드 파일 경로는 `cardOutputSrc(postId, index, lang?)` 로 언어를 끼운다
  (`card-01.webp` / `card-en-01.webp`). 겹치면 저장할 때의 경로→URL 치환이 어긋난다.
- 응답 locale 의 `translatedFrom` 은 그대로 두고 `manual` 은 넣지 않는다.

### Playwright — Omnis 를 목킹한 저장 흐름

`page.route("https://haddscience.vercel.app/omnis/**")` 로 `/api/sso/verify` 200 ·
`GET /posts` `[]` · `POST /media` → `{url}` · `POST /translate` → headline/body 를
`"EN: " + 원문` 으로 바꾼 덱 · `PUT /posts/<id>` → 본문 기록. localStorage 에
`hadd.sso.session.website-admin-dev` 세션을 심고 `/admin/` → 새 카드뉴스 → 제목 입력 →
카드 2 에 제목·본문 → 저장.

```
$ node scratchpad/agentB/deck-editor.mjs
로그인 후 화면: true
상단 안내 문구 보임: true
토스트: ["저장했습니다\n사이트에 곧 반영됩니다."]

업로드 7 건
  #1 24668 bytes · image/webp · x-post-id=20260907-1819
  #2 24972 bytes · image/webp · x-post-id=20260907-1819
  #3 13644 bytes · image/webp · x-post-id=20260907-1819
  #4 24668 bytes · image/webp · x-post-id=20260907-1819
  #5 25684 bytes · image/webp · x-post-id=20260907-1819
  #6 13644 bytes · image/webp · x-post-id=20260907-1819
  #7 13838 bytes · image/webp · x-post-id=20260907-1819

PUT 본문 요약
  content 언어: [ 'ko', 'en' ]
  [ko] title="부산대 콜로퀴엄 참가" blocks=3 translatedFrom=undefined manual=undefined
      1. image src=/omnis/api/website/media/20260907-1819/m1.webp alt="카드뉴스. haddscience 알아보기. @haddscience"
      2. image src=/omnis/api/website/media/20260907-1819/m2.webp alt="chapter 01. 🎤 연구실을 찾아갔습니다. 허채정 대표가 부산대학교 나노과학기술대학 콜로퀴엄에서 발표했습니다."
      3. image src=/omnis/api/website/media/20260907-1819/m3.webp alt="대표 한마디 💬. 허채정 HADD Science 대표"
  [en] title="EN title" blocks=3 translatedFrom="abcd1234abcd1234" manual=undefined
      1. image src=/omnis/api/website/media/20260907-1819/m4.webp alt="카드뉴스. haddscience 알아보기. @haddscience"
      2. image src=/omnis/api/website/media/20260907-1819/m5.webp alt="chapter 01. EN: 🎤 연구실을 찾아갔습니다. EN: 허채정 대표가 부산대학교 나노과학기술대학 콜로퀴엄에서 발표했습니다."
      3. image src=/omnis/api/website/media/20260907-1819/m6.webp alt="대표 한마디 💬. 허채정 HADD Science 대표"
  deck.cards[1].headline: "🎤 연구실을 찾아갔습니다"
  deck.cards[1].body: "허채정 대표가 부산대학교 나노과학기술대학 콜로퀴엄에서 발표했습니다."
  thumbnail: /omnis/api/website/media/20260907-1819/m7.webp
```

- 업로드 7 건 = ko 카드 3 + en 카드 3 + 썸네일 1.
- `content.en.blocks` 3개 전부 image, 2번 alt 에 `"EN: "`, `translatedFrom` 은 서버가 준
  `"abcd1234abcd1234"` 그대로, `manual` 없음.
- `content.ko.blocks` 3개, `deck` 은 원문(한국어)이다.
- en #1·#3 의 바이트 수가 ko 와 같은 것은 목이 headline/body 만 바꾸기 때문이다(표지·한마디는 원문 그대로).
  실제로 글이 바뀐 #5 만 크기가 다르다(24972 → 25684) — 영문 덱을 다시 구웠다는 증거다.

### 번역 API 가 502 일 때

```
$ node scratchpad/agentB/deck-editor.mjs --translate-502
로그인 후 화면: true
상단 안내 문구 보임: true
토스트: ["영문 카드는 만들지 못했습니다 — 다시 저장하면 다시 시도합니다"]

업로드 4 건
  #1 24668 bytes · image/webp · x-post-id=20260907-1819
  #2 24972 bytes · image/webp · x-post-id=20260907-1819
  #3 13644 bytes · image/webp · x-post-id=20260907-1819
  #4 13838 bytes · image/webp · x-post-id=20260907-1819

PUT 본문 요약
  content 언어: [ 'ko' ]
  [ko] title="부산대 콜로퀴엄 참가" blocks=3 translatedFrom=undefined manual=undefined
  deck.cards[1].headline: "🎤 연구실을 찾아갔습니다"
  thumbnail: /omnis/api/website/media/20260907-1819/m4.webp
```

원문은 그대로 저장되고 경고 토스트만 뜬다.

화면 캡처: `scratchpad/agentB/editor-before-save-ok.png` · `editor-after-save-ok.png` ·
`editor-before-save-502.png` · `editor-after-save-502.png`.

## 3. 품질 게이트

```
$ pnpm typecheck && pnpm lint && pnpm build
> tsc --noEmit
> eslint
(typecheck · lint 출력 없음 — 오류 0)

...
├ ○ /admin
├ ○ /admin/lint
├ ƒ /api/revalidate
├ ○ /robots.txt
└ ○ /sitemap.xml                      1m      1y
```

## 남은 것

- 옛 카드뉴스 10건 · 82장을 덱 JSON 으로 옮기는 일(계획서 3번째 줄)은 이 작업 밖이다.
- 번역 API(`POST /api/website/translate`)의 실제 동작은 Omnis 쪽 구현에 달려 있다.
  여기서 확인한 것은 목킹한 응답에 대한 편집기의 동작뿐이다.

## 3. 옛 카드뉴스 10건 재작성 · 반영 (Omnis `scripts/rebuild-cardnews.ts`)

옛 카드 82장을 에이전트 둘이 읽어 덱 JSON 으로 만들고(`content/data/cardnews-rebuild/`), 스크립트가
사진을 잘라 올리고 → Gemini 로 영문 덱 → 검사 페이지에서 두 언어를 그려 검사 → 고아 줄이면 줄바꿈을 넣어
다시(최대 3회) → NAS · Neon 에 반영했다. 넘치는 카드 3건은 에이전트가 덱을 나눠(옛 13장 → 새 21장 등) 풀었다.

최종 실행(Neon · 프로덕션 NAS, 영문 덱은 dry-run 결과 재사용):

```
172288085 … 옛 8 → 새 8 · 사진 5 · 수정 0 · 남은 문제 0 · 빠진 원문 0
172288167 … 옛 9 → 새 9 · 사진 6 · 수정 0 · 남은 문제 0 · 빠진 원문 0
172288285 … 옛 8 → 새 8 · 사진 4 · 수정 1 · 남은 문제 0 · 빠진 원문 0
172090069 … 옛 7 → 새 7 · 사진 6 · 수정 0 · 남은 문제 0 · 빠진 원문 0
172090197 … 옛 7 → 새 7 · 사진 6 · 수정 0 · 남은 문제 0 · 빠진 원문 0
172090251 … 옛 6 → 새 6 · 사진 5 · 수정 1 · 남은 문제 0 · 빠진 원문 0
171780067 … 옛 9 → 새 9 · 사진 7 · 수정 2 · 남은 문제 0 · 빠진 원문 0
171397323 … 옛 7 → 새 8 · 사진 2 · 수정 3 · 남은 문제 0 · 빠진 원문 0
171327290 … 옛 8 → 새 11 · 사진 3 · 수정 9 · 남은 문제 0 · 빠진 원문 0
171402558 … 옛 13 → 새 21 · 사진 3 · 수정 6 · 남은 문제 0 · 빠진 원문 0
```

"수정" 은 스크립트가 고아 줄에 넣은 줄바꿈 수. 대조표(옛 | 새 ko | 새 en)는 `cardnews-rebuild/<id>-compare.webp`,
카드별 기록은 `<id>-report.txt`. 실서비스 확인: `/omnis/api/website/posts/172288285` 의 ko · en 블록 8개가
`rebuild-ko-NN` · `rebuild-en-NN`, 사진 200, `/ko/news/172288285/` · `/en/news/172288285/` 에 새 카드 표시.

### 한계

- 검증 기준은 픽셀 일치가 아니다. 서체(Pretendard)와 색(디자인시스템 파랑)은 새 템플릿을 따른다.
- 171402558 은 원래 어두운 발표 슬라이드라 카드가 13 → 21 장으로 늘었다. 표는 글자를 그대로 담은 카드 둘로.
- 자동 줄바꿈 수정은 "마지막 두 낱말을 끌어내린다" 한 가지다. 더 나은 끊기는 편집기에서 사람이 고친다(덱이 저장돼 있다).
- 옛 사진은 카드 이미지에서 잘라낸 것이라 원본보다 해상도가 낮다(1024 기준).

## 4. 2026-09-08 재실행 — 사진 눌림 발견 · 전수 재작성

사용자가 172288085 카드 3 의 사진이 원본과 다르다고 짚었다(현수막 글자가 잘림). 원인과 대응은
`mydocs/troubleshootings/vercel-deploy-traps.md` 의 "카드뉴스: 글이 길면 사진이 소리 없이 눌려 잘렸다".
전수조사 결과 10건 중 9건 · 29장이 같은 상태였고, 사진 폭 옵션과 자동 물러서기를 넣어 10건 전부 다시 돌렸다.

```
172288085 옛 8 → 새 8 · 수정 9 · 남은 문제 0 · 빠진 원문 0
172288167 옛 9 → 새 9 · 수정 2 · 0 · 0
172288285 옛 8 → 새 8 · 수정 2 · 0 · 0
172090069 옛 7 → 새 7 · 수정 10 · 0 · 0
172090197 옛 7 → 새 7 · 수정 6 · 0 · 0
172090251 옛 6 → 새 6 · 수정 11 · 0 · 0
171780067 옛 9 → 새 10 · 수정 12 · 0 · 0   (카드 5 를 둘로 나눔 — 영문이 한 장에 안 들어감)
171397323 옛 7 → 새 8 · 수정 7 · 0 · 0
171327290 옛 8 → 새 11 · 수정 12 · 0 · 0
171402558 옛 13 → 새 21 · 수정 12 · 0 · 0
```

실서비스 확인: 172288085 카드 3 의 새 URL(`rebuild-2609080039-ko-03.webp`)이 새 렌더와 픽셀 차 0.2.
첫 반영에서는 같은 파일 이름 때문에 실제로는 바뀌지 않았었다(픽셀 차 29.0) — 위 문서의 두 번째 항목.

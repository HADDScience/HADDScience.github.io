---
kind: snapshot
status: active
canonical: ../plans/archives/2026-09-28-live-cardnews.md
last_verified: 2026-09-28
---

# 2026-09-28 — 카드뉴스를 HTML 로 그린다 · 작업 결과

계획서는 [`../plans/archives/2026-09-28-live-cardnews.md`](../plans/archives/2026-09-28-live-cardnews.md).

## 바꾼 것

| 파일 | 한 일 |
|---|---|
| `components/cardnews/card-face.tsx` | `CardImageLoading` 컨텍스트. 카드 안 사진 세 곳(ImgBox · split · overlay)이 이 값을 `loading` 으로 쓴다. 기본 `eager` 라 편집기·굽기는 그대로 |
| `components/cardnews/live-card.tsx` (새로) | 1080 캔버스를 본문 폭에 맞춰 `scale`. `ResizeObserver` 로 `--cn-scale` 을 넣고, 사진은 lazy |
| `components/cardnews/live-card.css` (새로) | 하이드레이션 전 기본 `--cn-scale` — 화면 폭 12구간, 각 구간의 가장 좁은 폭 기준 |
| `components/ds/post-body.tsx` | `deck` 을 받으면 k 번째 이미지 블록 자리에 k 번째 카드. 수가 다르면 이미지 그대로. 카드는 `BlurFade` 밖 |
| `app/[lang]/news/[id]` · `library/[id]` | 원문 언어 페이지에만 `post.deck` 을 넘긴다 |

## 실측 (dev, 운영 Omnis 를 upstream 으로)

서버 HTML 에 카드 글이 들어가는가 — 카드마다 제목·헤드라인 첫 12자를 HTML 텍스트에서 찾았다.

```
170271833 카드 12장 · 제목/헤드라인 12개 중 ko HTML 에 12개 · 구운 카드 img 0
171149202 카드 14장 · 제목/헤드라인 14개 중 ko HTML 에 14개 · 구운 카드 img 0 · links 블록 유지
영문 페이지(두 글 모두): HTML 카드 0 · 영문 구운 카드(-en-NN.webp) 그대로
덱 없는 글(169483428 라이브러리 · 172871704 텍스트): HTML 카드 0 · 이미지 그대로
```

구운 이미지와 같은 그림인가 — Playwright 로 `figure.live-card` 를 요소 단위로 찍어 구운 webp 와
나란히 놓았다(표지 · 본문 · 분할 · 차트 · 사진 · 참고 카드).

```
1440px  카드 776px · --cn-scale 0.71851…  콘솔·네트워크 에러 0
 390px  카드 342px · --cn-scale 0.31666…  에러 0
 360px  카드 312px · --cn-scale 0.28888…  에러 0
JS 끔 390px  --cn-scale .3166 (CSS 기본값) · 잘림 없음
JS 끔 1440px --cn-scale .7185 (CSS 기본값) · 잘림 없음
```

육안으로 구별되지 않았다(이모지 포함 — 구운 쪽도 macOS 에서 구웠다).

### 밟은 것

- **JS 를 끄면 본문이 통째로 비었다.** 다른 블록처럼 `BlurFade` 로 감쌌더니 서버 HTML 이
  `opacity:0` 으로 나가 JS 가 붙어야 드러났다. 이미지 블록도 원래 그렇지만, 카드는 글자를 읽히려고
  그리는 것이라 애니메이션 밖으로 뺐다.
- **로컬에서 카드 사진이 404.** dev 의 `/omnis/api/*` rewrite 가 로컬 Omnis(`localhost:3000`)를
  본다. 운영 사진으로 확인하려면 `OMNIS_UPSTREAM=https://omnis.haddscience.com pnpm dev`. 이 작업과 무관.

## 품질 게이트

```
pnpm typecheck  → 에러 0
pnpm lint       → 문제 0
pnpm build      → ✓ Compiled successfully · 363/363
```

## 운영 (`067f043`)

덱이 있는 35건을 전부 운영에서 불러 세 가지를 확인했다 — ko 페이지 HTML 카드 수 = 덱 카드 수 ·
카드마다 제목/헤드라인이 HTML 텍스트에 있음 · en 페이지 HTML 카드 0.

```
덱 있는 글 35건 중 통과 35건
```

운영 화면(168745762, 15장)을 390 · 1440px 에서 찍어 구운 이미지와 나란히 놓았다. 차이가 보이지 않았고
콘솔·네트워크 에러 0.

결과적으로 본문에 글자가 없던 37건 중 **35건에 글이 생겼다.** 남은 2건은 덱이 없는 라이브러리 글
(169483428 · 169345651) — `/admin` 에서 본문 문단을 채워야 한다.

## 덱이 없던 2건 — 이미지 속 글을 본문으로 (2026-09-28)

169483428(TOP 10 바이오 & 과학기술 뉴스, 이미지 1장) · 169345651(2026 AI×BIO 융합 시대, 5장).
이미지를 읽어 **적힌 글만** 옮겼다. 해석이나 보탬은 없다 — 수치도 이미지에 있는 것(개발 기간 50% 단축 ·
비용 30% 절감)만 적었다. 글은 해당 이미지 바로 뒤에 둔다.

저장은 관리 화면과 같은 경로로 했다 — Omnis 의 `PostInputSchema` 검증 → `savePost()`. 원본은 저장 전
통째로 백업했다. 169483428 은 제목 오타(과확기술 → 과학기술)를 이미지대로 고치고 비어 있던 요약을 채웠다.

```
169483428 블록 image → image,heading,text,heading,text,text · 제목 오타 수정
169345651 블록 image×5 → image,image,heading,text,image,heading,text,image,heading,text,image,heading,text,text
```

**안 된 것 둘.** 로컬 `.env.vercel` 의 민감 값(번역 키 · 사이트 주소 · 재검증 비밀)이 `[SENSITIVE]` 자리표시로만
들어 있다(`vercel env pull` 은 민감 값을 내려주지 않는다).
- 영문 번역이 돌지 않았다. → **같은 날 Omnis 세션(omnis-local-50)이 `scripts/retranslate-website-post.ts`
  (`fillTranslations` 직접 호출)로 두 건을 번역했다**(작업지시자 승인). 영문 블록을 API 로 읽어 한국어
  본문과 1:1 인 것을 확인했다(heading · text 순서 그대로, 수치 50% · 30% 동일). 영문 페이지에 보이는
  원문에 없는 문장(「K-Bio Surpasses 20 Trillion Won…」)은 본문이 아니라 「← Previous」 이전 글 링크다.
- 사이트 캐시 비우기가 실패했다. 기사 목록 재검증 주기(30분) 안에 반영된다.

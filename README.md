# haddscience.com (재구축)

아임웹으로 운영 중인 하드사이언스 홈페이지를 Next.js 로 옮기는 프로젝트.
디자인은 claude.ai/design 의 **HADD SCIENCE Design System** 을 따른다.

## 실행

```bash
pnpm dev        # http://localhost:3000 → /ko 로 리다이렉트
pnpm build      # next build (서버 렌더 + ISR)
pnpm lint
pnpm media:news # 아임웹에 남은 뉴스 미디어 재수집 (보통 다시 돌릴 일 없다)
```

기사는 Omnis 의 API 에서 온다. 로컬에서 Omnis 를 같이 띄우면 `.env.local` 에
`OMNIS_API_BASE=http://localhost:3000/api/website` · `OMNIS_DEV_ORIGIN=http://localhost:3000`
을 두고 사이트는 다른 포트(`pnpm dev -p 3123`)로 띄운다. 없으면 배포된 Omnis 를 읽는다.

## 배포

Vercel 프로젝트 `haddscience` 하나다 (`main` 푸시 → 자동 배포). 한 도메인
`haddscience.vercel.app` 아래에 `/`(이 사이트) · `/admin` · `/hub`(허브 프로젝트
`hadd-hub` 로 rewrite) · `/omnis`(Omnis 로 rewrite) 가 산다 — `next.config.ts`.

| 환경변수 | 뜻 |
| --- | --- |
| `DEPLOY_TARGET=pages` | 컨펌용. robots · `<meta robots>` 로 색인을 막는다. DNS 를 붙이면 뺀다 |
| `SITE_URL` | sitemap · robots 의 절대 주소 (기본 `https://haddscience.com`) |
| `OMNIS_API_BASE` | 기사를 읽는 Omnis API (기본 `https://omnis-hadd.vercel.app/omnis/api/website`) |
| `REVALIDATE_SECRET` | Omnis 가 저장 뒤 `/api/revalidate/` 를 부를 때 쓰는 비밀. Omnis 의 `WEBSITE_REVALIDATE_SECRET` 과 같은 값 |

2026-09-07 까지는 정적 export 를 GitHub Pages(컨펌)와 Synology(실서비스)에 올렸다. 기사가
Omnis 의 DB 로 가면서 서버 렌더가 필요해져 그 둘은 끝났다. 실도메인 `haddscience.com` 은
DNS 를 이 Vercel 프로젝트로 옮겨 붙인다.

## 스택

| 항목 | 값 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| UI | shadcn/ui preset `b1aKNEYd6` (luma / mist / blue / radius large) |
| 스타일 | Tailwind CSS v4 |
| 폰트 | Pretendard Variable (`app/fonts/`, `next/font/local`) |

`components.json` 의 프리셋을 바꾸려면 `pnpm dlx shadcn@latest init --preset <code>` 을 다시 돌린다.
현재 프리셋 코드는 `pnpm dlx shadcn@latest preset resolve` 로 확인할 수 있다.

## 구조

```
proxy.ts                언어 접두사 없는 요청을 /ko · /en 으로 보낸다. /admin · /api · /omnis · /hub 는 제외.
app/
  [lang]/               루트 레이아웃. <html lang> 이 로케일을 따라간다.
    page.tsx            홈
    about/              하드사이언스 · 팀:하드 · 위치
    products/           ADDGEL · LiVEGEL
    news/               목록(1p) · page/[page](2p~) · [id] 카드뉴스 상세
    library/            하드:라이브러리
    contact/            문의하기
    (legal)/            이용약관 · 개인정보처리방침
components/
  ds/                   디자인시스템 컴포넌트 (Tailwind 로 재구현)
  nav/                  NavBar · Footer · LanguageSwitcher
  forms/                ContactForm
  ui/                   shadcn 프리미티브
content/
  types.ts              SiteContent 인터페이스 — 언어별 딕셔너리의 계약
  ko.ts / en.ts         카피
  server.ts             서버 전용 로더. 기사는 Omnis API 에서 60초 캐시로 읽는다
  index.ts              언어 해석 · localePath
app/api/revalidate/     Omnis 가 기사를 저장하면 부른다. 기사 캐시를 즉시 비운다
app/robots.ts · sitemap.ts
scripts/
  fetch-news-media.mjs  아임웹 CDN → 미디어 이관 (이식 전 기록용)
```

### 렌더 방식

뉴스 페이지는 서버에서 렌더하고 ISR 로 캐시한다. `content/server.ts` 가 Omnis 의
`/api/website/posts` 를 `revalidate: 60` · 태그 `posts` 로 읽고, Omnis 가 저장·삭제 뒤
`/api/revalidate/` 를 불러 그 태그를 비운다. 그래서 관리 화면에서 저장하면 곧바로 반영된다.

기사 사진은 `/omnis/api/website/media/<id>/<name>` 상대 경로다. 배포에서는 `vercel.json` 이,
로컬에서는 `next.config.ts` 의 dev 전용 rewrite 가 `/omnis/*` 를 Omnis 로 넘긴다.
`next/image` 최적화는 켜지 않는다 — 사진은 올릴 때 이미 1600px webp 로 줄여 두고, 최적화기가
다시 받아 오면 NAS 왕복이 한 번 더 생긴다.

컴포넌트에 문자열을 하드코딩하지 않는다. 라벨 · aria-label · 배지처럼 화면에 보이는 모든
문자열은 `SiteContent` 의 `ui` · `legal` 섹션에 넣고 prop 으로 내려준다.
새 언어를 추가하려면 딕셔너리 하나를 만들고 `content/index.ts` 의 `AVAILABLE_LANGS` 와
`dictionaries` 에 등록하면 라우트 · 언어 스위처 · sitemap 이 함께 열린다.

## 디자인시스템 매핑

`app/globals.css` 가 프리셋 토큰 위에 디자인시스템 실측값을 덮어쓴다. 모든 색은
디자인시스템 HEX 를 OKLCH 로 변환한 값이며, 각 줄에 원본 HEX 를 주석으로 남겼다.

프리셋 기본값에서 의도적으로 벗어난 부분:

- `--radius: 1rem` — 디자인시스템 `--radius-lg: 16px` 와 정확히 맞추기 위해 프리셋의 0.875rem 에서 변경.
- `components/ui/button.tsx` 의 size — 디자인시스템 Button 스펙(36 / 48 / 56px)에 맞춰 확대.
- 브랜드 · 상태 · 제품 색을 `@theme inline` 에 등록해 `bg-brand-orange-500`,
  `text-status-success`, `bg-product-addgel` 같은 유틸리티로 쓴다.

디자인시스템 규칙 중 코드에 반영한 것:

- 그라디언트는 히어로 **하나만**. 페이지 헤더는 단색 navy.
- 아이콘 세트가 없으므로 아이콘을 그리지 않는다. 번호 라벨(`01`) + 2px 블루 룰,
  Tag pill, 유니코드 `→ › ‹ +` 만 쓴다.
- 투명도 + 블러는 스티키 헤더에만.
- 모션은 `cubic-bezier(.2,.6,.2,1)` 단일 커브. 색 120ms, 인터랙션 200ms.
- 자동 재생 캐러셀 금지 → 실제 사이트의 히어로 3장을 세로 밴드로 폈다.

## 제품 이미지

`public/products/*.webp` 는 아임웹 CDN 이 아니라 **사내 디자인 원본에서 직접 뽑은 투명 배경
컷아웃**이다. 출처는 `NAS/HADD Science/61. HADD 디자인/00_제품이미지/`.

| 파일 | 원본 |
| --- | --- |
| `addgel-syringe.webp` | `250213_애드젤-시린지타입/250312_애드젤-시린지타입 복사본.png` (2000×323) |
| `addgel-bottle.webp` | `250213_애드젤-바이알타입/250213_애드젤-바이알타입.png` (2048×2048) |
| `addgel-lyophilized.webp` | `250227_애드젤_동결건조타입/250305_애드젤_라이오필 타입.png` (1792×2304) |
| `livegel.webp` | `260508_라이브젤_제품이미지/라이브젤 이미지(배경없음).tif` (162×248) |

변환은 sharp 로 `trim()` → `resize(fit: inside)` → `webp(alphaQuality: 100)` 이다.
알파 채널이 살아 있으므로 **`mix-blend-multiply` 같은 합성 트릭이 필요 없다.**

제품마다 비율이 크게 다르다(시린지 5.2:1, 바이알 0.42:1). 그래서 고정 높이 박스 안에
`fill` + `object-contain` 으로 렌더한다.

`w-auto` + `max-h-full` 로는 하지 말 것. 폭이 확정되지 않은 상태에서 브라우저가 작은
srcset 후보를 고르고, 그 크기로 레이아웃이 굳어 이미지가 축소된 채 남는다.

> 계측 주의: `sizes` 가 붙은 이미지의 `img.naturalWidth` 는 density 보정된 값이라 실제
> 서브된 픽셀이 아니다. 해상도를 확인하려면 `img.currentSrc` 를 다시 받아
> `createImageBitmap` 으로 재보라.

이미지를 교체한 뒤에는 **`.next` 를 지워야 한다.** `.next/cache/images` 가 `url + w + q` 로
캐싱하므로, 파일명을 그대로 두고 내용만 바꾸면 옛 이미지가 계속 나온다(알파 없는 옛
JPEG 이 서브되는 증상).

사진 판(`--surface-plate`)은 **라이트 · 다크 양쪽에서 동일하게 밝다.** 유리와 투명 캡이
어두운 판 위에서는 읽히지 않고, 디자인시스템도 이 판을 UI 표면이 아니라 촬영 표면
(`white or a light-grey plate`)으로 규정한다. `.dark` 에서 재정의하지 말 것.

## 랜딩 첫 화면 (ScrollStage)

`components/ds/scroll-stage.tsx` — 배경은 고정된 채 패널 세 장(히어로 · 비전 · 제품
라인업)이 위로 흐르고, 섹션이 끝나면 배경이 밀려 올라가면서 주요 수치 밴드로 이어진다.

섹션 높이를 `300svh` 로 두고 그 안에 `sticky top-0 h-svh` 배경을 깐 것이 전부다.
**JS 스크롤 계산을 쓰지 않는다** — 정적 배포에서 JS 가 늦게 붙어도 레이아웃이 무너지지
않는다. 패널 등장만 BlurFade 가 맡는다. 실측: 패널 3×807px, scrollY 800·1600 에서
배경 `top:0` 고정, 2400 에서 `-709px` 로 이탈.

**상단 네비는 스테이지 위에서 프로스티드 글래스로 얹힌다** (`components/ds/nav-reveal.tsx`).
숨기지 않는다 — 히어로 위에서는 `bg-white/8 + backdrop-blur(14px)`, 흰 로고, 흰 네비 링크,
흰 CTA 버튼으로 바뀐다. 스테이지가 끝나 헤더 높이에 닿는 순간 — 주요 수치 밴드가 시작될
때 — 평소의 흰 반투명(0.88) + blur(16px) 로 돌아온다.

스테이지 섹션에 `-mt-[77px]` 이 붙어 있다. **스티키 헤더는 투명해도 문서 흐름에서 자리를
그대로 차지**하므로, 이만큼 당기지 않으면 배경 위에 흰 띠가 남는다. 77px = `h-19`(76px) +
`border-b`(1px) — 76px 만 당기면 1px 흰 줄이 남는다.

상태 전환은 `@custom-variant over-hero (body[data-nav-over-hero="true"] &)` 로 만들었다.
NavBar 에서 `over-hero:text-white` 처럼 쓴다. 로고는 컬러/흰색 두 장을 겹쳐 두고 CSS
opacity 로만 바꾼다(합계 28KB, 스크롤 중 둘 다 쓰이므로 어차피 받는다).

- 네비는 레이아웃에 있어 모든 페이지가 공유하므로, 숨김 상태를 NavBar 의 state 로 두면
  페이지 이동 후에도 값이 남는다. 그래서 **스테이지가 있는 페이지에만 NavReveal 을 두고**
  마운트된 동안만 `body[data-nav-hidden]` 을 건다. 언마운트 시 속성을 지운다.
- state 대신 body 속성을 직접 만지는 이유: effect 안에서 setState 를 부르면 리렌더 연쇄가
  생기고 `react-hooks/set-state-in-effect` 에도 걸린다. 외부 DOM 동기화가 effect 의 본래 용도다.
- `visibility: hidden` 까지 끈다. `opacity: 0` 만으로는 탭 순서에 남아 보이지 않는 링크에
  키보드 포커스가 들어간다.

> ★ 관찰 대상은 **스테이지 섹션 전체**여야 한다. 처음엔 스테이지 끝에 1px 센티넬을 두었는데
> 맨 아래에서 맨 위로 점프하면 네비가 숨지 않았다. IntersectionObserver 는 교차 상태가
> *바뀔 때만* 발화하고, 얇은 센티넬은 "루트 위"와 "루트 아래"가 모두 비교차라 그 사이를
> 건너뛰면 콜백이 아예 불리지 않는다. 화면보다 높은 요소를 관찰하면 모든 전환이 상태
> 변화가 되어 빠른 스크롤·점프에서도 놓치지 않는다.

배경 콜라주는 `scripts/build-hero-collage.mjs` 가 만든다. 사내 활동 사진 6장(실험실 ·
수상식 무대 · BIO USA 코리아관 · 심포지엄 · 내부 미팅 · 네트워킹)을 합쳐 **밝기와 블러로**
눌렀다 — 네이비 스크림은 alpha 0.26 까지만 쓴다. 처음엔 0.62 로 덮었더니 파란 색면처럼
보여서, 색으로 덮는 대신 `brightness 0.42 + blur 18` 로 사진을 배경으로 물러나게 했다.
콜라주 자체 흰 글자 대비 5.73:1, 히어로 그라디언트 합성 후 12.13:1. 원본은 NAS 에 있고 레포에 넣지 않는다 —
경로는 `scripts/hero-collage-sources.txt` 에 있다(`public/` 에 두면 배포 사이트로
NAS 경로가 노출된다).

> 디자인시스템은 "No patterns, no textures, no stock-photo backgrounds" 라고 못박는다.
> 여기 쓰는 것은 스톡이 아닌 자사 기록이고 네이비 스크림 아래 텍스처로만 쓰이므로
> 히어로 한 곳에 한해 확장했다. 다른 곳에 사진 배경을 늘리지 말 것.

와이드/세로 두 장을 `<picture>` 의 `source media` 로 갈랐다. next/image 두 개를
`hidden`/`sm:hidden` 으로 감추면 **숨긴 쪽도 다운로드된다**(데스크톱에서 76KB 낭비).

## 위치 지도

`components/ds/location-map.tsx` 는 사업장 3곳을 탭으로 고르고 지도 하나를 바꿔 보여준다.

**API 키가 없다.** `https://www.google.com/maps?q=<검색어>&output=embed&hl=ko` 는 키 없이
동작하는 임베드다. 정적 배포에는 서버가 없어 키를 숨길 곳도 없으므로 이 방식이 맞다.
(이 URL 은 iframe 안에서만 동작한다. 주소창에 직접 넣으면 "must be used in an iframe" 이 뜬다.)

지도는 좌표가 아니라 **검색어**(`OfficeLocation.mapQuery`)로 찍는다. 주소가 바뀌면 그
문자열만 고치면 되고, 좌표를 따로 관리할 필요가 없다. 세 곳 모두 구글이 실제 장소로
해석하는 것을 확인했다(수원대·성균관대·경기바이오센터).

iframe 하나당 Maps JS 를 통째로 받으므로 **카드마다 지도를 깔지 않는다.** 선택식으로 두면
한 번만 받는다. `loading="lazy"` 로 화면에 들어올 때 받는다.

길찾기는 카카오 · 네이버 · Google 로 내보낸다. 국내 사용자는 카카오·네이버를 더 쓴다.

카카오맵으로 바꾸려면 JS 키를 발급받아 도메인을 등록해야 한다. 그때는 이 컴포넌트만
교체하면 되고, 콘텐츠(`mapQuery`)는 그대로 쓸 수 있다.

## 미디어 호스팅 방식 (결정)

**기사와 사진은 Omnis 에 있다** (2026-09-07 결정). 기사는 Neon 의 `WebsitePost`, 사진은
Synology NAS 의 `website/<id>/…` 이고, 둘 다 Omnis 의 `/api/website/*` 로 읽고 쓴다.
정본은 Omnis 저장소의 `mydocs/plans/2026-09-07-website-posts-db.md`.

이전(2026-08-12 ~ 09-07)에는 이미지를 저장소에 커밋해 사이트와 함께 정적 배포했다("git 이
DB"). 관리 화면이 Omnis SSO 로 옮겨 가면서 브라우저가 GitHub 토큰을 들 수 없게 됐고,
서버가 대신 커밋하게 하느니 DB 에 두는 편이 단순했다. 그 시절 기사 JSON(`content/data/news/`)과
사진(`public/news/`)은 이식이 검증될 때까지 남겨 두고, 그 뒤 지운다.

NAS 가 꺼지면 사진이 안 나오는 문제는 Omnis 쪽 미디어 경로가 `immutable` 1년 캐시를 주어
Vercel 엣지가 막는다 — 사진 이름이 업로드마다 고유해서 가능하다.

## 콘텐츠 관리 (`/admin`)

사내 구성원이 개발자 없이 기사를 쓰고 고칠 수 있게 만든 화면이다.
사용법은 [`docs/콘텐츠-관리.md`](docs/콘텐츠-관리.md) — 그쪽은 비개발자용이다.

### 데이터 모델

기사 한 건이 Omnis 의 `WebsitePost` 한 행이다. `content` 안에 **모든 언어**가 들어간다.
아래는 API 가 주고받는 모양이고, `content/types.ts` 의 `Post` 와 같다. Zod 정본은 Omnis 의
`lib/schemas/website.ts` — 필드를 바꾸면 둘을 같이 고친다.

```jsonc
{
  "id": "20260827-1030",
  "date": "2026.08.27",
  "sourceLang": "ko",          // 사람이 직접 쓴 언어. 나머지는 여기서 번역된다
  "thumbnail": "/omnis/api/website/media/…/….webp",
  "externalHref": null,        // 아임웹 등 외부에 원문이 있으면 그 주소
  "content": {
    "ko": { "title": "…", "summary": "…", "blocks": [ … ] },
    "en": { "…": "…", "translatedFrom": "3f2a…", "manual": false }
  }
}
```

본문은 `PostBlock[]` 이다 — `heading` · `text` · `quote` · `image` 네 가지.
**텍스트는 자동 번역 대상이고 이미지는 언어별로 따로 넣는다.** 카드뉴스처럼 그림 안에
글자가 박혀 있으면 한국어판 이미지를 영문 기사에 그대로 쓸 수 없기 때문이다.

목록 순서는 `position` 이다. 새 글은 0 으로 들어가고 나머지가 한 칸씩 밀린다.

### 왜 이런 구조인가

| 결정 | 이유 |
| --- | --- |
| **Omnis 가 데이터베이스** | 관리 화면이 Omnis SSO 로 로그인하므로 저장소도 그쪽(Neon · NAS)이 맡는다. 예전의 "git 이 DB" 는 사람마다 GitHub 토큰이 필요했다. |
| **Decap CMS 를 쓰지 않음** | OAuth 웹 플로우에 `client_secret` 을 쥔 토큰 교환 서버가 필요해 별도 도메인에 프록시를 하나 더 띄워야 한다. 게다가 UI 테마가 로고 교체 수준이라 디자인시스템을 입힐 수 없다. |
| **Omnis SSO** | Hub · ip-platform 과 같은 로그인(`lib/omnis-auth.ts`). 세션 토큰을 Bearer 로 Omnis API 에 보낸다. 퇴사 처리는 Omnis 계정 비활성화 하나로 끝난다. |
| **리치 에디터를 쓰지 않음** | Tiptap · BlockNote 는 자체 테마 체계가 있어 우리 토큰·라디우스·버튼 규격을 그대로 입히기 어렵고, 결과물이 HTML 문자열이라 언어별 번역·이미지 분리가 까다로워진다. 블록이 네 종류뿐이라 직접 만드는 편이 작고 정확하다. |
| **미리보기 = 실제 컴포넌트** | 편집기 오른쪽 미리보기가 기사 페이지와 같은 `components/ds/post-body.tsx` 를 쓴다. 두 벌로 나뉘면 반드시 어긋난다. |
| **사진 먼저, 글은 마지막에** | 저장은 사진을 하나씩 올린 뒤 돌아온 URL 로 기사 JSON 의 임시 경로를 바꿔 넣고 마지막에 PUT 한다(`lib/admin-posts.ts`). 사진이 하나라도 실패하면 기사는 저장하지 않는다. |

### 자동 번역

Omnis 가 저장 시점에 Gemini 로 돌린다(`lib/website-translate.ts`). 규칙은 예전 Actions
스크립트와 같다 — 번역본의 `translatedFrom` 이 원문 해시와 다를 때만, `manual: true` 는
건드리지 않고, 블록 수·타입·이미지 경로는 원문에서 그대로. 실패해도 원문은 저장되고
관리 화면에 경고가 뜬다. 다시 저장하면 다시 시도한다.

### 카드뉴스 편집기

`/admin` 의 **새 카드뉴스**. 인스타용 정사각 카드뉴스를 폼으로 만들어 사이트 기사로
게시하고 1080×1080 PNG 로도 내려받는다. 자유 캔버스가 아니라 **레이아웃 고정 템플릿**이다 —
사용자는 카드 종류를 고르고 칸을 채울 뿐, 위치·색·서체는 손대지 못한다.

| 파일 | 역할 |
| --- | --- |
| `content/types.ts` `CardDeck` · `Card` | 덱 모델. 표지 · chapter 7 레이아웃(standard · image-top · split · overlay · text · stat · list) · 인용 |
| `lib/cardnews.ts` | 카드 종류 목록, 기본값(`newCard`), alt 문장(`cardText`), 파일 경로 규칙 |
| `components/cardnews/card.css` · `card-face.tsx` | 1080×1080 카드 한 장. 미리보기와 래스터화가 같은 DOM 을 쓴다 |
| `lib/cardnews-export.ts` | html-to-image 로 캔버스 굽기, webp/png 변환, fflate zip |
| `components/admin/deck-editor.tsx` | 편집 화면. 카드 목록 · 폼 · 미리보기 · 넘침 경고 · 저장/내보내기 |

**디자인 원본은 스킬 `~/.claude/skills/hadd-cardnews/scripts/build_cardnews.py`** 다.
`card.css` 는 그 `base_css()` 를, `card-face.tsx` 는 `render_*` 함수를 1:1 옮긴 것이다.
둘이 어긋나면 스크립트가 정답이고, 토큰(색 · 8px 격자 · 타이포 스케일)도 거기서 바꾼다.

저장하면 Omnis 에 이렇게 들어간다.

```
WebsitePost.deck                 덱 원본. content.ko.blocks 는 카드 이미지 블록(alt = 카드 텍스트)
NAS website/<id>/<무작위>.webp   원본 사진(1600px 이내, 재편집용) · 구운 카드(1080) · 썸네일(640)
```

- **왜 브라우저에서 굽나.** 정적 사이트라 서버도 헤드리스 Chrome 도 둘 곳이 없다. 대신 미리보기
  DOM 을 그대로 찍으니 미리보기와 결과물이 갈리지 않는다. html-to-image 는 SVG foreignObject
  를 거치므로 **Chrome 권장** — Safari 는 폰트·이미지 임베드가 불안정하다.
- **재편집.** `post.deck` 이 있는 글은 목록에서 열면 글 편집기가 아니라 덱 편집기가 뜬다.
  다시 저장하면 카드를 전부 새 이름으로 다시 굽는다. 옛 카드 파일은 NAS 에 남는데 그
  정리는 Omnis 쪽 몫이다(아직 없음 — "남은 작업").
- **영문판.** 카드는 그림이라 번역되지 않는다. 번역 스크립트가 이미지 블록의 `src` 를 원문에서
  복사하므로 영문 기사도 같은 카드를 보여준다. alt 만 번역된다.
- **이모지.** 카드 안 이모지는 굽는 사람의 OS 이모지 폰트로 그려진다(macOS 는 Apple 이모지).
  스킬 스크립트(Linux Chrome)와 그 부분만 다르다.

## 콘텐츠 출처

2026-08-07 에 haddscience.com 을 브라우저로 크롤링해 옮겼다. 카피는 원문 그대로다.
예외 두 가지는 `content/ko.ts` 주석에 남겼다:

1. 히어로의 "세로운 기준" 오타를 About 페이지의 동일 문장에 맞춰 "새로운"으로 고쳤다.
2. What We Do 항목의 이모지를 번호 라벨로 대체했다 (디자인시스템의 no-emoji 규칙).
   뉴스 제목의 이모지는 고객사가 발행한 편집 콘텐츠이므로 그대로 두었다.

## 남은 작업

| 항목 | 내용 |
| --- | --- |
| **뉴스 38건의 본문** | 상위 10건은 카드뉴스를 이관해 사이트 안에 상세 페이지가 있다. 나머지 38건은 `href` 가 아직 아임웹 원문을 가리킨다. **이 상태로는 아임웹을 해지할 수 없다.** 이제는 `/admin` 에서 카드뉴스 편집기로 다시 만들거나 이미지를 올리면 된다. |
| **카드뉴스 접근성** | 이관한 10건은 본문이 여전히 이미지뿐이라 스크린리더·검색엔진이 읽지 못한다. `/admin` 에서 글마다 요약과 본문 문단을 채우면 해결된다 — 기사 모델이 이미 텍스트 블록을 받는다. |
| **영문 뉴스 본문** | 텍스트는 CI 가 자동 번역한다. 다만 이관한 10건과 카드뉴스 편집기로 만든 글은 본문이 이미지뿐이라 번역할 텍스트가 없다 — `/admin` 의 English 탭에서 이미지 블록만 영문 카드로 교체하거나, 본문을 텍스트로 다시 쓰는 편이 낫다. |
| **옛 기사 파일 삭제** | `content/data/news/` 와 `public/news/` 는 Omnis 이식(49건 · 사진 132장)이 프로덕션에서 검증되면 지운다. 사이트는 더 이상 읽지 않는다. |
| **NAS 고아 사진 정리** | 카드뉴스를 다시 저장하면 옛 카드 파일이 NAS 에 남고, 저장하지 않은 새 글의 사진도 남는다. Omnis 에 "기사가 참조하지 않는 WebsiteMedia 삭제" 작업이 필요하다. |
| **카드뉴스 영문 자동 생성** | 덱은 텍스트라 번역할 수 있지만, 굽는 단계가 브라우저에만 있어 CI 가 영문 카드를 만들지 못한다. 필요해지면 Actions 에 Playwright 를 두고 `card-face` 를 헤드리스로 찍는 경로를 추가한다. |
| **영문 감수** | 현행 영문 사이트에 원문이 있는 부분(About · Team · Location · Product 헤드라인)은 그대로 썼고, 없는 부분(히어로 · 폼 · 뉴스 제목 · FAQ)만 번역했다. 대외 공개 전 원어민 감수 권장. |
| **문의 폼 백엔드** | 지금은 `mailto:` 로 메일 클라이언트를 연다. 서버 수신함이 정해지면 `components/forms/contact-form.tsx` 의 `handleSubmit` 만 교체하면 된다. |
| **약관 · 개인정보처리방침** | 법적 효력이 있는 문서라 임의로 작성하지 않았다. 공개 전에 현행 원문을 옮겨야 한다. 문의 폼이 개인정보를 수집하므로 필수. **위치 페이지의 Google 지도 임베드는 제3자 쿠키를 심으므로 처리방침에 함께 명시해야 한다.** |
| **LiVEGEL 고해상도 컷아웃** | 배경 없는 원본이 `NAS/61. HADD 디자인/00_제품이미지/260508_라이브젤_제품이미지/라이브젤 이미지(배경없음).tif` 하나뿐이고 162×248 밖에 안 된다. lanczos 로 228×420 까지 올려 쓰는 중이므로 라벨 잔글씨가 소프트하다. 고해상도 컷아웃을 받으면 교체할 것. (같은 폴더의 1134×1718 버전은 배경이 살아 있어 쓸 수 없다.) |
| **팀 사진** | 인물 사진 자산이 없어 이니셜 플레이트로 대체했다. |
| ~~주소 표기 불일치~~ | 해결됨. 현행 사이트가 `505호` / `514호` 를 혼용하는데 `505호` 가 맞다고 확인받았다(2026-08-07). |
| ~~파트너 섹션~~ | 해결됨. 사내 PPT 에서 로고 31개를 추출해 Marquee 로 넣었다(2026-08-12). 아래 "파트너 로고" 참고. |

## 파트너 로고

`public/partners/` 의 31개 로고는 사내 PPT 에서 추출한 원본이다.
출처: `NAS/HADD Science/99. 각종 발표 자료s/항목별  분할 모음/하(사업화,연혁,사업장)/협력 파트너십(HRP)_260324.pptx`

```bash
node scripts/extract-partner-logos.mjs "<pptx 경로>"   # → public/partners/ + content/partners.generated.json
```

pptx 는 zip 이라 `ppt/media/` 에 원본이 그대로 들어 있다. PPT 가 갱신되면 스크립트의
`MEDIA` 매핑을 고치고 다시 돌린 뒤 `content/partners.ts` 를 재생성한다.
SVG 는 래스터화하지 않고 그대로 쓰고, 비트맵은 높이 120px 로 정규화한다(알파 보존).

홈의 파트너 섹션은 원본 사이트처럼 격자로 깔지 않고 **Magic UI Marquee** 로 두 줄을
반대 방향으로 흘린다(`components/ds/partner-marquee.tsx`). 로고가 31개라 격자로는
홈이 로고 벽이 되는데, 띠로 만들면 높이를 반으로 줄이면서 규모는 더 잘 드러난다.

- **평상시 grayscale, hover 시 원색.** 원색 31개를 동시에 깔면 디자인시스템의 색 예산
  (74% blue / 14% sky / 8% neutral / 3% orange / 1% magenta)이 무너진다. 파트너 브랜드
  가이드라인이 회색조를 금지하는 곳이 있으면 해당 클래스에서 `grayscale` 만 빼면 된다.
- **자동 재생에 대한 판단.** 디자인시스템은 auto-playing carousel 을 금지하지만, 그 규칙은
  읽어야 하는 콘텐츠를 임의로 넘기지 말라는 취지다. 로고 띠는 개별 항목을 읽히려는 장치가
  아니므로 예외로 뒀다. 대신 hover 로 멈추고 `prefers-reduced-motion` 에서는 정지한다.
- **미식별 로고 1건.** PPT 의 `image25.jpg`(주황색 M 마크, 78×77)는 어떤 기관인지 식별할 수
  없어 제외했다. 이름을 알려주면 `MEDIA` 매핑에 추가하면 된다.

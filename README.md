# haddscience.com (재구축)

아임웹으로 운영 중인 하드사이언스 홈페이지를 Next.js 로 옮기는 프로젝트.
디자인은 claude.ai/design 의 **HADD SCIENCE Design System** 을 따른다.

## 실행

```bash
pnpm dev        # http://localhost:3000 → /ko 로 리다이렉트
pnpm build      # 정적 export → out/  (+ postbuild)
pnpm preview    # out/ 을 http://localhost:4100 에서 서빙 (배포와 동일한 조건)
pnpm lint
pnpm media:news # 아임웹에 남은 뉴스 미디어 재수집 (보통 다시 돌릴 일 없다)
```

`output: "export"` 라서 `next start` 는 동작하지 않는다. 배포 결과를 확인할 때는
반드시 `pnpm preview` 로 정적 파일을 직접 서빙해 볼 것 — `pnpm dev` 에는 서버가 있어서
정적 배포에서 깨지는 것(루트 리다이렉트, 이미지 최적화 부재)이 드러나지 않는다.

## 배포

`out/` 하나를 두 곳에 올린다. 컨펌 화면과 실서비스 화면이 구조적으로 같다.

| 대상 | 용도 | 방법 |
| --- | --- | --- |
| `haddscience.github.io` | 대표님 컨펌용 | `main` 푸시 → GitHub Actions |
| `haddscience.com` | 실서비스 | Synology Web Station + `pnpm deploy` |

설정 절차와 주의사항은 [`deploy/README.md`](deploy/README.md) 에 있다.

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
proxy.ts                dev 전용. 언어 접두사 없는 요청을 /ko · /en 으로 보낸다.
                        정적 배포에는 서버가 없어 동작하지 않는다 (postbuild 가 대신함).
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
  news.ko.ts            뉴스 48건 (날짜 · 썸네일 · 카드뉴스 · 정렬의 단일 출처)
  news.en.ts            영문 제목만 매핑. 나머지는 news.ko.ts 재사용
  index.ts              언어 해석 · localePath
scripts/
  fetch-news-media.mjs  아임웹 CDN → public/news/ 로 미디어 이관 + webp 리사이즈
  postbuild.mjs         out/ 에 .nojekyll 과 루트 index.html 생성 후 검증
  deploy-synology.sh    out/ → Synology Web Station rsync
```

### 정적 export 에서 지켜야 할 것

`output: "export"` 라서 서버 기능을 쓸 수 없다. 다음 세 가지를 깨뜨리지 말 것.

- **`searchParams` 금지.** 빌드가 실패한다. 목록 페이지네이션은 `?page=2` 대신
  `/news/page/2` 정적 라우트로 만들었다.
- **`_next/` 를 위한 `.nojekyll`.** GitHub Pages 의 Jekyll 이 `_` 폴더를 지운다.
- **루트 `/` 는 페이지가 아니라 `postbuild.mjs` 가 만든 리다이렉트 문서다.**

`next/image` 최적화도 없다(`unoptimized: true`). 이미지는 커밋 전에 sharp 로 미리
리사이즈해 둔다 — 제품 이미지는 수동, 뉴스 미디어는 `pnpm media:news` 가 처리한다.

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

## 콘텐츠 출처

2026-08-07 에 haddscience.com 을 브라우저로 크롤링해 옮겼다. 카피는 원문 그대로다.
예외 두 가지는 `content/ko.ts` 주석에 남겼다:

1. 히어로의 "세로운 기준" 오타를 About 페이지의 동일 문장에 맞춰 "새로운"으로 고쳤다.
2. What We Do 항목의 이모지를 번호 라벨로 대체했다 (디자인시스템의 no-emoji 규칙).
   뉴스 제목의 이모지는 고객사가 발행한 편집 콘텐츠이므로 그대로 두었다.

## 남은 작업

| 항목 | 내용 |
| --- | --- |
| **뉴스 38건의 본문** | 상위 10건은 카드뉴스를 이관해 사이트 안에 상세 페이지가 있다. 나머지 38건은 `href` 가 아직 아임웹 원문을 가리킨다. **이 상태로는 아임웹을 해지할 수 없다.** `scripts/fetch-news-media.mjs` 의 `CARD_SETS` 에 남은 글의 이미지 목록을 추가하고 `pnpm media:news` 를 다시 돌리면 된다. |
| **카드뉴스 접근성** | 아임웹 뉴스 본문은 텍스트가 0자이고 전부 1024×1024 이미지다. 그대로 옮겼으므로 스크린리더와 검색엔진이 본문을 읽을 수 없다. alt 에 제목+순번만 넣어둔 상태다. 최소한 글마다 2~3문장 요약 텍스트를 넣는 것을 권한다. |
| **영문 뉴스 본문** | 뉴스 **제목**은 번역했지만 카드뉴스 이미지 안의 글자는 한국어다. 영문 카드뉴스를 따로 만들어야 한다. |
| **영문 감수** | 현행 영문 사이트에 원문이 있는 부분(About · Team · Location · Product 헤드라인)은 그대로 썼고, 없는 부분(히어로 · 폼 · 뉴스 제목 · FAQ)만 번역했다. 대외 공개 전 원어민 감수 권장. |
| **문의 폼 백엔드** | 지금은 `mailto:` 로 메일 클라이언트를 연다. 서버 수신함이 정해지면 `components/forms/contact-form.tsx` 의 `handleSubmit` 만 교체하면 된다. |
| **약관 · 개인정보처리방침** | 법적 효력이 있는 문서라 임의로 작성하지 않았다. 공개 전에 현행 원문을 옮겨야 한다. 문의 폼이 개인정보를 수집하므로 필수. |
| **LiVEGEL 고해상도 컷아웃** | 배경 없는 원본이 `NAS/61. HADD 디자인/00_제품이미지/260508_라이브젤_제품이미지/라이브젤 이미지(배경없음).tif` 하나뿐이고 162×248 밖에 안 된다. lanczos 로 228×420 까지 올려 쓰는 중이므로 라벨 잔글씨가 소프트하다. 고해상도 컷아웃을 받으면 교체할 것. (같은 폴더의 1134×1718 버전은 배경이 살아 있어 쓸 수 없다.) |
| **팀 사진** | 인물 사진 자산이 없어 이니셜 플레이트로 대체했다. |
| ~~주소 표기 불일치~~ | 해결됨. 현행 사이트가 `505호` / `514호` 를 혼용하는데 `505호` 가 맞다고 확인받았다(2026-08-07). |
| **파트너 섹션** | 현행 홈에 "함께 만드는 기술의 미래, 하드사이언스의 파트너들입니다" 파트너 로고 밴드가 있으나 로고 자산이 없어 넣지 않았다. |

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

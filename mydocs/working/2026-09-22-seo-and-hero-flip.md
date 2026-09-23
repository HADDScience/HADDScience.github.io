---
kind: snapshot
status: active
canonical: ../plans/2026-09-22-seo-and-hero-flip.md
last_verified: 2026-09-22
---

# 2026-09-22 — 검색 노출과 히어로 플립 그리드 · 작업 결과

계획서는 [`../plans/2026-09-22-seo-and-hero-flip.md`](../plans/2026-09-22-seo-and-hero-flip.md).

## 1. 히어로 — 수상 사진 2×3 플립 그리드

### 시안 비교

NAS 의 시상식 사진 108장(`09. 하드사이언스 사진/251125_…(장관상 대상)`)과 우수사례 공모전
사진 6장(`62. HADD 홈페이지/기사 원본 파일/우수사례_공모전_수상식_사진`)을 컨택트시트로
훑어 무대·백드롭이 넓게 잡힌 컷을 골랐다. 셀피와 상장 스캔은 뺐다.

네 시안을 구워 한 화면에서 비교했다(브라우저에서 플립까지 동작).

| 시안 | 처리 | 36장 합계 |
|---|---|---|
| A | brightness 0.42 · blur 18 · 스크림 0.26 (현행 콜라주와 같은 톤) | 149KB |
| **B (채택)** | **brightness 0.5 · saturation 0.72 · blur 6 · 스크림 0.30** | **254KB** |
| C | 흑백 → `tint(#1A4A8F)` 듀오톤 · blur 8 | 193KB |
| D | 수상 + 활동 혼합 · blur 10 · 칸 사이 여백 10px | 200KB |

### 실측

```
$ node scripts/build-hero-tiles.mjs --variant=b
B · 수상 · 장면이 읽히는 톤(얕은 블러)
  36장 · 254KB · /Users/jeong-uchang/work/hadd-website/public/hero/tiles
scripts/hero-tiles-sources.txt 기록 완료
```

흰 글자 대비 (1440×900, `prefers-reduced-motion` 스냅샷이라 텍스트가 없는 배경만 측정):

```
h1 영역(112,260 420×290): 평균 13.55:1 · 최악(가장 밝은 화소) 9.83:1
```

디자인시스템 기준 4.5:1 을 넘는다. 배경 자체가 아니라 **히어로 그라디언트까지 합성된**
화면 픽셀에서 잰 값이다.

받는 무게는 오히려 줄었다.

| | 옛 콜라주 | 플립 그리드 |
|---|---|---|
| 와이드 첫 화면 | 229KB (한 장) | 약 96KB (앞면 6 + 뒷면 6) · 나머지 6장은 나중에 |
| 와이드 전체 | 229KB | 155KB (18장) |
| 세로 전체 | 129KB | 94KB (18장) |

한 칸이 1/6 크기라 같은 화소당 압축이 잘 듣는다.

### 구현에서 밟은 것

1. **뒷면이 3D 로 돌지 않고 사진이 뒤집혀 보였다.** `preserve-3d` 는 직계 자식에만
   적용된다. `rotateX(180deg)` 와 `backface-visibility` 를 `<picture>` 안쪽 `<img>` 에
   걸었더니 picture 가 평면으로 눌러, 첫 플립 뒤 인물이 거꾸로 선 채 그대로 보였다.
   회전을 `<picture>` 자체에 옮겨 해결.
2. **회전 전반부에 사진이 톡 튀었다.** 두 면 모두 `step % 3` 을 쓰면, 아직 보이고 있는
   면의 사진이 플립 시작과 동시에 갈린다. 앞면은 짝수 걸음, 뒷면은 홀수 걸음의 사진만
   들도록 바꿨다. 걸음별 확인:

   ```
   step 0 · 보이는 면 앞 · 앞면 0 · 뒷면 1 → 화면 0
   step 1 · 보이는 면 뒤 · 앞면 0 · 뒷면 1 → 화면 1
   step 2 · 보이는 면 앞 · 앞면 2 · 뒷면 0 → 화면 2
   step 3 · 보이는 면 뒤 · 앞면 2 · 뒷면 0 → 화면 0
   ```

   보이는 면의 사진은 회전 중에 바뀌지 않고, 다음에 보일 사진은 미리 받아 둔 상태가 된다.
3. **닮은 사진 두 장이 동시에 떴다.** 처음에는 13장을 `(i*5) % 13` 으로 돌려 18칸을
   채웠다. 단체 기념사진 두 장이 옆칸에 같이 떠서, 흐린 배경에서는 같은 그림으로 보였다.
   서로 다른 18장을 골라 **순서가 곧 배치**가 되게 하고(세 장씩 칸 0~5), 닮은 컷을 같은
   줄에 두지 않았다.
4. **`20251125_151049.jpg` 를 뺐다.** 화면에 「전담기관 담당자 / 중소벤처기업부 장관상」이
   크게 찍힌 컷인데, 이건 전담기관(수원대 창업보육센터) 시상이라 우리 상이 아니다.
   `KakaoTalk_20251125_234755763_24.jpg`(대상 상장 · 팀 기념)로 교체.

### 남은 판단 — 타사 수상자의 얼굴

시상식 사진에는 다른 수상 기업과 기관 관계자가 함께 찍혀 있다. 채택한 B 는 블러 6 이라
얼굴 윤곽이 남는다. 대외 공개 전에 사용 가능 여부를 확인하는 편이 안전하다. 걸리면
얼굴이 작게 잡힌 컷만 남기거나 시안 A(블러 18)로 내린다 — 둘 다 스크립트 인자 하나다.

## 2. 검색 노출

### 키워드가 사이트 어디에 들어갔나

「오가노이드」와 「생체소재」는 2026-09-22 이전 `content/ko.ts` 에 **한 번도 없었다**.
메타에만 적으면 근거 없는 신호가 되므로 화면 카피에 함께 넣었다. 표현은 대표 발표자료
(`~/.claude/skills/hadd-ecm-domain`)의 확정 문구를 따랐다 — ADD Gel 의 적용 분야는
「① 3차원 세포배양 연구용 ② 세포치료제 제조용 ③ 오가노이드 배양용」, LiVEGEL 은
「배양과 이미징을 동시에」, Vivo Gel 은 「줄기세포·오가노이드 세포치료용 의료 생체소재」다.

| 자리 | 전 | 후 |
|---|---|---|
| `meta.title` | 하드사이언스 \| 3D 세포배양의 새로운 기준 | 하드사이언스 HADD SCIENCE \| 오가노이드 · 3D 세포배양 생체소재 |
| `meta.description` | …3D 세포배양 소재 ADDGEL과 LiVEGEL을 개발합니다. | …**오가노이드**와 3차원(3D) 세포배양을 위한 **생체소재**를 만듭니다. Animal free 젤타입 배지 ADDGEL과 액상형 배지 LiVEGEL을 연구용으로 공급합니다. |
| 히어로 둘째 줄 | 17년간의 연구, 그리고 지금 / 세포배양의 새로운 기준을 만듭니다. | 17년간의 **3D 세포배양과 생체소재** 연구, 그리고 지금 / **오가노이드 배양**, 세포배양의 새로운 기준을 만듭니다. |
| 주요 수치 | 17년 — 3D 세포배양 · 바이오 소재 연구 | 17년 — **오가노이드 · 3D 세포배양 생체소재** 연구 |
| 제품 라인업 | 제형만 고르면 3차원 배양이 시작됩니다. | 제형만 고르면 **스페로이드 · 오가노이드** 3차원 배양이 시작됩니다. |
| About 카드 | 바이오소재 연구 / 바이오소재를 연구하고 신제품을 기획합니다. | **생체소재** 연구 / **오가노이드 배양과 세포치료**에 쓰이는 **생체소재**를 연구하고 신제품을 기획합니다. |
| ADDGEL 설명 | 기존 매트리젤 / 하이드로젤을 대체하는 3D 세포배양용 배지 조성물 | …3D 세포배양 · **오가노이드 배양**용 배지 조성물 |
| LiVEGEL 설명 | (ADDGEL 과 같은 문장이었다) | 넣고 바로 쓰는 액상형 — **오가노이드 · 스페로이드** 3D 세포배양용 배지 조성물 |

영문도 같은 자리를 organoid · biomaterials 로 맞췄다.

### OG 이미지

`public/og/hadd-og.png` (1200×630 · 112KB). 수상 사진 타일 위에 네이비 그라디언트와
로고·한 줄 설명. `scripts/build-og-image.mjs` 로 다시 만든다.

글꼴이 Pretendard Variable 인데 저장소에 **woff2 한 벌만** 있어 sharp 의 SVG 렌더러도
next/og(satori)도 읽지 못한다. 브라우저는 읽으므로 헤드리스 크롬으로 한 번 찍어 정적
PNG 로 커밋했다 — 히어로 타일과 같은 성격(NAS·로컬 도구에 의존하는 수동 산출물)이다.

### 무엇을 넣었나

| 파일 | 한 일 |
|---|---|
| `lib/seo.ts` (새로) | `sitePath`·`absoluteUrl`·`pageUrl`·`languageAlternates`·`pageMetadata`·`JsonLd` 와 Organization·WebSite·Breadcrumb·NewsArticle·Product 생성기 |
| `app/[lang]/layout.tsx` | `metadataBase`·`keywords`·기본 OG/트위터·`verification`·Organization+WebSite JSON-LD. **`alternates` 제거** |
| 각 `page.tsx` 15개 | `pageMetadata()` 로 canonical·hreflang·OG 통일. 하위 페이지에 BreadcrumbList |
| `news/[id]`·`library/[id]` | `NewsArticle` + `og:type article` + `article:published_time` |
| `news/page/[page]`·`library/page/[page]` | canonical 을 자기 페이지로, `robots: noindex, follow` |
| `products`·`products/livegel` | `Product`(가격·재고 없음) |
| `app/sitemap.ts` | URL 마다 `xhtml:link` 언어 짝, 기사에 `lastModified` |
| `app/feed.xml/route.ts` (새로) | RSS 2.0, 한국어 기사 30건, 날짜순 재정렬 |
| `docs/검색엔진-등록.md` (새로) | 비개발자용 등록 절차 236줄 |

레이아웃에서 `alternates` 를 뺀 것이 이번 변경의 핵심이다. 레이아웃은 자기가 어느 경로에
얹혔는지 모르므로 루트밖에 적을 수 없었고, 그래서 **모든 하위 페이지의 언어 짝이 틀린 곳을
가리키고 있었다.**

### 실측 (dev :3123, 2026-09-22)

```
$ curl -s localhost:3123/ko/ | grep canonical/hreflang/og
<link rel="canonical" href="https://haddscience.com/ko/"/>
hrefLang="ko"        href="https://haddscience.com/ko/"
hrefLang="en"        href="https://haddscience.com/en/"
hrefLang="x-default" href="https://haddscience.com/ko/"
<meta property="og:title"     content="하드사이언스 HADD SCIENCE | 오가노이드 · 3D 세포배양 생체소재"/>
<meta property="og:site_name" content="HADD SCIENCE"/>
<meta property="og:locale"    content="ko_KR"/>
<meta property="og:image"     content="https://haddscience.com/og/hadd-og.png"/>
JSON-LD: Organization · PostalAddress · WebSite

$ curl -s localhost:3123/ko/about/
"@type":"BreadcrumbList" … position 1 HADD SCIENCE → position 2 하드사이언스

$ curl -s localhost:3123/ko/news/page/2/
<meta name="robots" content="noindex, follow"/>
<link rel="canonical" href="https://haddscience.com/ko/news/page/2/"/>

$ curl -s -D- localhost:3123/feed.xml
HTTP/1.1 200 · content-type: application/rss+xml; charset=utf-8
<title>하드사이언스 HADD SCIENCE | 오가노이드 · 3D 세포배양 생체소재</title>
<item> 몸속 장기를 만드는 연구원, 중학생 76명을 만나다 · pubDate Wed, 16 Sep 2026 15:00:00 GMT

$ curl -s localhost:3123/sitemap.xml | grep -c "<url>"
328          ← url 마다 xhtml:link 3줄
```

소유확인 태그는 **환경변수를 넣고 다시 빌드해야** 나간다는 것을 실제로 확인했다.

```
$ pnpm build                                   (환경변수 없음)
$ curl localhost:3124/ko/ | grep -c site-verification
0

$ GOOGLE_SITE_VERIFICATION=gtest123 NAVER_SITE_VERIFICATION=ntest456 pnpm build
$ grep site-verification .next/server/app/…/ko.html
<meta name="google-site-verification" content="gtest123"/>
<meta name="naver-site-verification" content="ntest456"/>
```

페이지가 빌드 시점에 렌더되므로(SSG) 환경변수만 바꾸고 재배포하지 않으면 태그가 나가지
않는다. `docs/검색엔진-등록.md` 에 그 단계를 굵게 적었다.

### 중복 주소

운영 도메인을 확인했다(Vercel API · 실제 HTTP).

```
https://www.haddscience.com/   → 308 https://haddscience.com/
https://haddscience.vercel.app/ → 307 …/ko/   (대표 주소로 넘어가지 않는다)
https://haddscience.com/        → 307 …/ko/
```

`vercel.app` 주소가 같은 내용을 그대로 서브한다. 이번 배포부터 canonical 이 전부
`haddscience.com` 을 가리키므로 색인은 한쪽으로 모이지만, 완전히 끊으려면 Vercel 쪽에
리다이렉트를 걸어야 한다. **이번 작업에서는 건드리지 않았다.**

현재 운영본에는 canonical 태그가 아예 없다(2026-09-22 확인) — 이 배포로 처음 생긴다.

## 3. 품질 게이트

```
$ pnpm typecheck
> tsc --noEmit
(출력 없음 · exit 0)

$ pnpm lint
> eslint
(출력 없음 · exit 0)

$ pnpm build
✓ Compiled successfully in 1737ms
✓ Generating static pages using 11 workers (362/362) in 1905ms
  /feed.xml · /robots.txt · /sitemap.xml 포함
```

화면 확인: 1440×900 과 414×860 에서 헤드리스 크롬으로 히어로를 찍었다. 데스크톱 3열×2행,
모바일 2열×3행, 플립 뒤에도 사진이 바로 서 있고 여섯 칸이 모두 다른 사진이다.

## 4. 배포 (2026-09-23)

`feat/seo-and-hero-flip` 을 origin/main 위로 리베이스(다른 세션이 관리 화면 분리 커밋 5개를
먼저 올려 두었다. `mydocs/orders/20260922.md` 한 곳이 충돌 — 두 줄을 나란히 남겼다)하고
ff 머지 후 푸시. 품질 게이트는 리베이스한 트리에서 다시 돌렸다(363 페이지 생성).

```
b62ecb8..42cd7fa  main -> main
```

운영 확인 — 전 경로 실제 HTTP 요청.

```
/ko/ /en/ /ko/about/ /en/about/ /ko/about/team/ /ko/about/location/
/ko/products/ /ko/products/livegel/ /ko/news/ /ko/library/ /ko/contact/
/ko/terms/ /ko/privacy/ /en/products/livegel/ /en/news/
/sitemap.xml /robots.txt /feed.xml /og/hadd-og.png
/hero/tiles/w-01.webp /hero/tiles/p-18.webp /admin          → 전부 200

canonical  https://haddscience.com/ko/
hreflang   ko · en · x-default (페이지별로 자기 경로)
JSON-LD    Organization · PostalAddress · WebSite
og:image   https://haddscience.com/og/hadd-og.png
```

### 배포 직후 발견 — Omnis 의 DB 가 죽어 있다

`/ko/news/page/2/` 가 404 이고 사이트맵 URL 이 328개에서 **22개**로 줄었다. 기사가 하나도
없다는 뜻이다. 원인은 이 저장소가 아니다.

```
$ curl -s -o /dev/null -w "%{http_code}" https://omnis-hadd.vercel.app/api/website/posts
500

Vercel 런타임 로그 (프로젝트 omnis-hadd, 2026-09-23 00:36~00:40 UTC)
  PrismaClientInitializationError: Invalid `prisma.websitePost.findMany()` invocation:
  Can't reach database server at `ep-cool-heart-b3mtdee2-pooler.c-4.ap-southeast-1.aws.neon.tech:5432`
```

**DB 는 죽지 않았다. Neon 무료 한도를 넘겼다.** Prisma 가 그것을 "Can't reach database
server"(P1001)로 바꿔 보여줘 서버가 내려간 것처럼 읽혔다. 로컬에서 같은 운영 URL 로
Prisma 를 한 번 붙여 서버가 보낸 말을 그대로 받았다.

```
$ PROBE_URL=<운영 DATABASE_URL> node dbprobe.mjs
Invalid `prisma.websitePost.count()` invocation:
Error querying the database:
  ERROR: Your account or project has exceeded the quota. Upgrade your plan to increase limits.
```

연결 자체는 멀쩡하다 — 시작 메시지를 직접 보내 보면 풀러·직결 두 엔드포인트 모두
인증 요청(`R`)으로 답한다. 거절은 **쿼리 단계**에서 일어난다.

플랜은 Vercel 마켓플레이스의 Neon **Free(`free_v3`)** — 프로젝트당 저장소 0.5GB,
컴퓨트 100 CU-시간. Neon 프로젝트 `old-smoke-02400115`. 둘 중 어느 한도를 넘겼는지는
쿼리가 막혀 DB 안에서 확인할 수 없다(Neon 콘솔 Usage 에서 봐야 한다).

Omnis 에 크론은 없다(`vercel.json` 의 `crons` 가 비었다). 컴퓨트 시간은 평소 트래픽이
쓴다 — 직원의 Omnis 사용, 이 사이트의 ISR 재검증(60초), 방문 비콘 쓰기.

`content/server.ts` 의 `listPosts()` 는 실패하면 빈 배열을 돌려준다(뉴스 때문에 홈페이지
전체가 500 으로 죽지 않게 한 설계다). 그래서 **DB 가 죽은 동안 빌드된 이 배포본은 뉴스·
라이브러리 목록과 사이트맵이 빈 채로 구워졌다.** 정적 페이지라 그대로 남는다.

| 무엇 | 지금 |
|---|---|
| 회사 소개·제품·문의·법적 문서 | 정상 |
| 히어로·검색 메타·구조화 데이터·OG | 정상 |
| 뉴스·라이브러리 목록, 사이트맵의 기사 | **빈 상태** |
| `/feed.xml` | 30건이 보인다 — 요청 시점 렌더라 Vercel 데이터 캐시의 옛 응답을 쓴다 |

한도가 풀리면 ISR(60초)로 저절로 다시 채워진다. 배포를 다시 할 필요는 없다.
12초 간격으로 여섯 번 다시 불러 확인했으나, API 가 500 인 동안에는 채워지지 않는다.

### 복구 (2026-09-23)

Neon 을 Launch(사용량 과금 · 월 기본료 없음)로 올려 한도가 풀렸다. 실측:

```
Omnis posts API                  200
haddscience.com/omnis/...        200
Prisma 직접 연결                  WebsitePost 153행

/ko/news/        기사 링크 16개      (빈 목록 → 복구)
/ko/news/page/2/ 404 → 200
/feed.xml        30건
/sitemap.xml     22개에서 안 움직임  ← 다시 배포해서 해결
```

다시 배포하자 사이트맵이 328개로 돌아왔다. 복구 뒤 전 범위 재확인(2026-09-23):

```
경로 22개 전부 200
sitemap <loc> 328 · feed <item> 30
/ko/news 기사 링크 16 · /ko/library 20
홈 JSON-LD        Organization · PostalAddress · WebSite
기사 JSON-LD      NewsArticle · BreadcrumbList · WebPage · Organization · WebSite
```

사이트맵만 스스로 돌아오지 않았다. 함정은
[`../troubleshootings/vercel-deploy-traps.md`](../troubleshootings/vercel-deploy-traps.md)
맨 아래에 적었다.

`app/sitemap.ts` 에 `export const revalidate = 3600` 을 넣어 볼까 했으나 **빌드 출력이
그대로였다**(`○ /sitemap.xml  1m  1y`) — 안쪽 fetch 의 60초가 이미 라우트 값으로 잡혀
있어 동작이 바뀌지 않는다. 동작을 바꾸지 않는 줄은 넣지 않고 되돌렸다.

## 6. 후속 (2026-09-23) — 같은 사진 중복 · DB 깨우는 주기

### 같은 사진이 두 칸에 뜨던 것

파일은 18장 다 달랐지만 연사가 섞여 있었다. 흐린 타일을 한 장에 모아 보니 1·5·9(무대
라인업), 3·18(무대 전경), 4·12·15(같은 보드 앞 단체), 2·14(같은 백드롭 앞 팀)가 사실상 같은
그림이었다. 칸마다 세 장을 고정하는 구조로는 막을 수 없어(칸들이 다른 박자에 뒤집혀 어느
줄끼리 만날지 정해져 있지 않다) 방식을 바꿨다.

- 사진마다 장면을 단다. 연사는 한 장만, 닮은 컷은 한 장면으로. **18장 · 8개 장면.**
- 뒤집힐 칸에는 떠 있는 장면과 겹치지 않는 사진 중 가장 오래 안 나온 것을 한 박자 전에
  넣는다(`lib/hero-rotation.ts`).
- 첫 묶음에서 한 번 틀렸다 — 「상장 사진」과 「테이블 사인」이 같은 대상 안내판이라 흰
  안내판 두 장이 나란히 떴다(dev 에서 16초·30초 컷). 묶음을 고치고 「무대 전경」도 무대
  장면에 합쳤다. 장면이 줄어든 만큼 우수사례 시상식의 Omnis 발표 컷을 새 장면으로 더했다.

```
$ node scripts/build-hero-tiles.mjs
  사진 18장 · 장면 8개 · 타일 36장 · 244KB
설명 문단(흰 78%) 최저 대비 5.89:1 — p-06 대상 수상기업 보드 · 제품

$ node scripts/check-hero-rotation.mjs
사진 18장 · 장면 8개 · 100,000번 뒤집기
  ✓ 모든 순간 여섯 칸의 장면이 서로 다르다
  ✓ 뒤집힐 때마다 장면이 바뀐다
  ✓ 뒤집히는 면에는 한 박자 전에 넣어 둔 사진이 뜬다

장면을 6개로 줄인 목록을 넣으면 → 1,000번 중 786번 중복 (검사가 살아 있다)
```

운영(`b39f73c`)에서 3·9·15·21·27·33초를 찍어 여섯 컷 모두 장면이 서로 다른 것을 봤다.

### DB 를 깨우는 주기

`content/server.ts` 의 기사 목록 재검증을 60초 → 30분. 저장 즉시 반영은 웹훅이 맡는다 —
양쪽 연결을 운영에서 확인했다(사이트 `/api/revalidate` 는 틀린 비밀에 403, Omnis 운영에
`WEBSITE_REVALIDATE_SECRET` 있음). 빌드 출력의 재검증 칸이 `1m → 30m` 으로 바뀌었다.

이 저장소에서 Neon 을 깨우는 경로는 이제 둘이다 — 기사 목록(최대 30분에 한 번)과 방문
비콘(`/api/hit`, 페이지를 볼 때마다 한 번 쓴다). 비콘은 묶어 보내려면 Omnis 쪽 일이다.

## 5. 남은 것

- ~~**타사 수상자 얼굴**~~ — 작업지시자가 괜찮다고 확인(2026-09-23).
- ~~**Neon 한도**~~ — 해결됨(2026-09-23, Launch 전환).
- ~~**컴퓨트 사용량 줄이기**~~ — 기사 목록 재검증 60초 → 30분(2026-09-23, 6절). 방문 비콘 묶어 보내기는 Omnis 쪽 일로 남는다.
- **소유확인 코드** — 아직 없다. 받아서 Vercel 환경변수에 넣고 재배포하면 태그가 나간다.
- **`haddscience.vercel.app` 리다이렉트** — canonical 로 덮었지만 주소 자체는 살아 있다.
- **네이버 채널** — 네이버는 자사 서비스(블로그·카페·뉴스)를 웹사이트보다 위에 놓는다.
  「하드사이언스」 첫 화면을 노린다면 웹사이트 등록만으로는 부족하다.
- **기사 본문이 이미지뿐인 글** — 카드뉴스로 이관한 10건은 검색엔진이 읽을 텍스트가 없다.
  「오가노이드」·「생체소재」로 걸릴 문서를 늘리려면 이쪽이 실질적이다(README "남은 작업").

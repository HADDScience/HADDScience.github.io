---
kind: reference
status: active
canonical: mydocs/troubleshootings/domain-cutover-traps.md
last_verified: 2026-09-18
---

# 아임웹에서 도메인을 넘겨받으며 밟은 함정 (2026-09-18)

`haddscience.com` 을 아임웹에서 이 Vercel 프로젝트로 옮긴 날 실제로 겪고 고친 것들이다.
순서와 근거는 [orders/20260918.md](../orders/20260918.md) 에 있다.

## 옛 아임웹 주소가 우리 사이트로 되돌아와 404 가 난다

가장 아프게 물린 곳이다.

옛 목록 카드는 본문이 없는 글을 `https://www.haddscience.com/news/?bmode=view&idx=…` 로 보냈다.
아임웹이 그 도메인을 서비스하던 동안에는 맞는 주소였다. 도메인이 이쪽으로 넘어오고 `next.config.ts` 의
리다이렉트가 그 주소를 `/ko/news/<idx>/` 로 바꾸면서, **아직 옮기지 않은 글**은 상세 페이지가 없어
404 가 됐다(사이트 안 페이지는 본문 블록이 있는 글만 만든다 — `content/server.ts` 의 `hasArticle`).

**대응:** `externalArticleHref()` 로 원문 주소의 호스트를 아임웹 기본 주소
`haddscience.imweb.me` 로 바꾼다. 목록 카드와 상세 진입(`app/[lang]/news/[id]/page.tsx`) 양쪽에 건다.
구독이 살아 있는 동안 같은 글이 그대로 보인다.

**그래서 아임웹 해지는 남은 글을 모두 옮긴 뒤여야 한다.** 도메인·메일 전환이 끝났다고 해지하면
옛 글 30건 가까이가 본문째 사라진다. 전환 당일 이 사실을 놓치고 해지해도 된다고 알렸다가 되돌렸다.

## DNS 를 옮겨도 통신사 캐시에는 옛 주소가 남는다

전환 직후 "갑자기 아임웹이 다시 뜬다"는 상황. 되돌아간 것이 아니라 **리졸버 캐시**였다.

같은 KT 안에서도 서버마다 달랐다 — `168.126.63.1` 은 아임웹 IP(13.225.117.x)를,
`168.126.63.2` 는 Vercel IP 를 돌려줬다. 상위 `.com` 위임과 구글·클라우드플레어는 모두 Vercel 이었다.

**확인 순서:** `dig +norec @a.gtld-servers.net NS <도메인>` 으로 위임을 먼저 본다(여기가 맞으면 전환은 끝난 것이다) →
`dig @8.8.8.8` · `@168.126.63.1` 처럼 리졸버별로 A 를 본다 → `curl --resolve <호스트>:443:<Vercel IP>` 로
우리 사이트 자체는 멀쩡한지 가린다. 맥 캐시는 `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`.
아임웹 구독이 살아 있는 동안은 옛 IP 로 들어간 사람에게 옛 사이트가 그대로 보인다.

## 검색 차단이 켜진 채로 도메인이 붙는다

`DEPLOY_TARGET=pages` 가 남아 있어 실도메인에서도 `robots.txt` 가 전부 `Disallow` 였고 페이지에
`noindex` 가 붙었다. 컨펌용 배포를 막으려던 값이다. **대응:** DNS 를 붙이는 순간 프로젝트 환경변수에서
지우고 다시 배포한다. 확인은 `curl https://<도메인>/robots.txt` 와 페이지의 `<meta name="robots">`.

## www 와 apex 가 둘 다 200 이면 로그인이 막힌다

Vercel 에 두 주소를 다 붙이면 둘 다 사이트를 서빙한다. 검색엔진에 같은 글이 둘로 보이는 것보다
더 급한 문제는 **관리 화면 로그인**이다 — Omnis SSO 는 앱 id 하나를 오리진 하나에 묶어서(`lib/sso.ts`)
등록되지 않은 `www` 오리진에서는 `origin_not_allowed` 로 막힌다.

**대응:** `next.config.ts` 의 redirects 에 `has: [{ type: "host", value: "www.…" }]` 규칙을 넣어
apex 로 308 한다. 경로·쿼리는 그대로 따라간다.

## 서브도메인으로 옮긴 앱은 basePath 를 빼야 한다

허브는 홈페이지의 `/hub` 아래에 rewrite 로 얹혀 살아서 `basePath: "/hub"` 였다. 자산 경로가 홈페이지의
`/_next` 와 부딪히지 않게 하려던 것이다. `hub.haddscience.com` 루트로 옮기면서 그 접두어를 빼고,
코드에 박혀 있던 `/hub/...` 링크(로그인 안내·온보딩 이미지)도 함께 고쳐야 했다. Omnis 쪽 등록도
`origin: https://hub.haddscience.com` · `basePath: ""` 로 바꾼다.

## 메일 레코드는 따로 옮겨야 한다

네임서버를 바꾸면 A 레코드만 따라오는 것이 아니라 **그 도메인의 모든 레코드가 새 DNS 기준**이 된다.
MX·SPF 를 옮기지 않은 채 네임서버를 바꾸면 회사 메일이 끊긴다.

옮기기 전 아임웹 DNS 관리 화면을 못 찾으면 권한 서버에 직접 물으면 된다 —
`dig @<현재 NS> MX <도메인>` · `TXT` · 흔한 하위 이름들. 이 도메인에는 A(apex·www) · MX 둘 · SPF 하나뿐이었고
DKIM·DMARC 는 없었다. Vercel DNS 는 같은 이름·값의 MX 를 우선순위만 달리해서 넣지 못한다
(`A conflicting record exists`) — 옛 DNS 의 10번·20번이 같은 호스트였으므로 10번만 넣었다.

SPF 는 수신처(네이버웍스)와 맞지 않는 값(`include:_spf.daum.net`)이 그대로 있었다.
`include:spf.worksmobile.com` 을 앞에 더하자 받는 쪽 헤더가 `spf=pass` 로 바뀌었다.
확인은 Gmail 에서 `RAW` 로 받아 `Authentication-Results` 를 읽는 것이 가장 빠르다.

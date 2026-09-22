---
kind: snapshot
status: active
canonical: mydocs/plans/2026-09-22-contact-to-omnis-inquiry.md
last_verified: 2026-09-22
---

# 2026-09-22 — 문의하기 → Omnis 문의함 (사이트 쪽) · 법적 문서 작성

계획서의 2단계(사이트 라우트·폼·문구)와 5단계(개인정보처리방침)를 했다.
Omnis 쪽(모델·엔드포인트·알림·검토 화면)은 `omnis-local-50` 세션이 맡고,
정본 계획서는 Omnis `mydocs/plans/2026-09-22-website-inquiry-to-crm.md` 다.

## 바뀐 것

| 파일 | 무엇 |
|---|---|
| `app/api/contact/route.ts` (새) | 폼 접수 → 공유 비밀을 붙여 Omnis `POST /api/website/inquiries` 로 중계 |
| `components/forms/contact-form.tsx` | `mailto:` 제출 → `fetch` 제출. 허니팟·체류시간·보내는 중·실패 되돌림·동의 옆 방침 링크 |
| `components/ds/legal-doc.tsx` (새) | 약관·방침 렌더러 하나. 절·문단·목록·표 |
| `content/types.ts` | `LegalDoc`·`LegalSection` 추가. 폼 문구 5개 추가 |
| `content/ko.ts` · `content/en.ts` | 개인정보처리방침 11절 · 이용약관 9절 · 실패 문구 |
| `app/[lang]/(legal)/{privacy,terms}/page.tsx` | 자리표시 카드 → `LegalDocument` |
| `lib/site-env.ts` · `content/server.ts` | `OMNIS_API_BASE` 를 한 곳으로 (기본값이 두 군데 적혀 있었다) |
| `vercel.json` | `regions: ["icn1"]` |

## 계약 (Omnis 와 합의, 2026-09-22)

사이트 → Omnis `POST /api/website/inquiries`, `Authorization: Bearer <INQUIRY_SECRET>`.
본문에 `name` `organization` `email` `phone` `topic` `message` `lang` `ip` `userAgent`.
`consent` 는 보내지 않는다 — 동의 없이는 사이트가 애초에 보내지 않고, 동의 시각은 `createdAt` 이다.

응답: `201` 접수 · `200` 5분 안 같은 문의(중복) · `400 invalid_inquiry` · `401 forbidden` ·
`429 rate_limited` · `503 unavailable`. **사이트는 200 과 201 을 똑같이 다룬다.**

## 왜 브라우저를 Omnis 에 직접 붙이지 않았나

붙이면 그 엔드포인트가 공개돼 봇이 사이트를 건너뛰고 Omnis 를 바로 때린다.
사이트 서버가 한 번 받아 공유 비밀을 붙이면 Omnis 는 이 사이트가 보낸 것만 받고,
CORS 를 열 일도 없다. 비밀을 나누는 방식은 `app/api/revalidate` 와 같다.

## 봇 거르기

허니팟(숨은 `company` 칸)과 체류시간(3초 미만) 둘 다, 걸리면 **201 을 주고 조용히 버린다.**
실패를 알려 주면 봇이 맞을 때까지 고쳐 온다. CAPTCHA 는 넣지 않았다 — 문의량이 적어
효과보다 이탈이 크고, 뚫려도 CRM 이 아니라 문의함에 쌓인다.

## 실측

### 라우트 (목킹 Omnis + `next start`)

```
1 정상                                   → 201 {"ok":true}        Omnis 수신 O
2 허니팟(company 채움)                    → 201 {"ok":true}        Omnis 수신 X
3 elapsedMs 120                          → 201 {"ok":true}        Omnis 수신 X
4 필수 누락 + 이메일 형식                  → 400 fields{name:required, message:required,
                                                      email:invalidEmail, consent:required}
5 이름 101자                              → 400 fields{name:tooLong}
6 Omnis 429                              → 429 {"error":"rate_limited"}
7 같은 문의 재전송(Omnis 200 duplicate)   → 201 {"ok":true}
```

7건을 보내 Omnis 가 받은 것은 2건(1·7). 받은 본문에 `consent` 는 없고
`ip=203.0.113.9`(`x-forwarded-for` 맨 앞) · `userAgent` 는 들어 있다.

```
비밀 없는 배포   → 503 {"error":"unavailable"}
                  로그: [contact] INQUIRY_SECRET 이 없다. 문의를 Omnis 로 보내지 않았다.
Omnis 다운       → 문의 503, /ko/contact/ 200, /ko/ 200
```

### 브라우저 (Playwright 헤드리스 크롬)

```
허니팟              x=-9999 · tabindex=-1 · 부모 aria-hidden="true"
빈 제출             오류 4개, 첫 오류 "필수 항목입니다."
Omnis 꺼진 채 제출   실패 카드 + 메일 되돌림(제목·본문에 입력값 그대로)
영문 페이지 제출     성공 카드, Omnis 가 lang:"en" topic:"sample" 로 수신
동의 옆 링크         "개인정보처리방침" → /ko/privacy, target=_blank
                    새 탭을 열어도 원래 탭의 이름·내용이 그대로 남음
```

### 법적 문서

```
데스크톱 /ko/privacy  절 11 · 표 2 · 가로넘침 0px
        /en/privacy  절 11 · 표 2 · 가로넘침 0px
        /ko/terms    절 9  · 표 0 · 가로넘침 0px
        /en/terms    절 9  · 표 0 · 가로넘침 0px
모바일(390px)         위와 같음. 표는 칸 안에서 가로 스크롤(canScroll:true, moved:true)
```

표의 "접수일로부터 3년" 이 `3 / 년` 으로 끊겨 `break-keep` 을 줬다.
카드뉴스 CSS 가 `word-break: keep-all` 을 쓰는 것과 같은 이유다.

품질 게이트 `pnpm typecheck && pnpm lint && pnpm build` 통과.

### 진짜 Omnis 와의 왕복 (Omnis 세션이 확인, 2026-09-22)

비밀을 주고받지 않으려고 Omnis 세션이 이 사이트를 자기 쪽에서 띄워 확인했다.

```
cd /Users/jeong-uchang/work/hadd-website
OMNIS_API_BASE=http://localhost:3001/api/website INQUIRY_SECRET=<omnis .env 값> \
  pnpm exec next start -p 3277
→ http://127.0.0.1:3277/ko/contact/ 에서 브라우저로 폼 제출
```

폼: "문의가 접수되었습니다. / 영업일 기준 1~2일 내에 담당자가 회신드립니다."

Omnis `WebsiteInquiry` 에 선 행:

```
id           da1ca48b-a062-4a5f-94fc-e890d1a71813
createdAt    2026-09-22T06:24:05.224Z
name         박실증          organization  연세대학교 의과대학 신경과학교실
email        siljeung@yonsei.ac.kr          phone  010-9876-5432
topic        pricing         lang  ko
ip           ::ffff:127.0.0.1               userAgent  Mozilla/5.0 … Chrome/153
status       NEW
reviewedById null   reviewedAt null   reviewNote null
orgId        null   contactId  null   quoteId    null
```

`consent` 는 없고 `ip`·`userAgent` 는 들어왔다. **승인 전 세 id 가 전부 null** — 계획서가 말한
"사람 검토" 가 실제로 걸려 있다. 알림 3건(허채정·윤훈·김경훈). 시험 데이터는 지웠다.

## 아직 못 한 것

- **양쪽 Vercel 에 공유 비밀 등록.** `openssl rand -base64 32` 로 하나 만들어
  사이트 `INQUIRY_SECRET` · Omnis `WEBSITE_INQUIRY_SECRET` 에 같은 값.
- **파기 스크립트의 실제 삭제.** Omnis 세션이 `scripts/purge-website-inquiries.ts` 를 만들었다
  (`NEW`·`REJECTED`·`SPAM` 은 행째, `ACCEPTED` 는 본문·연락처만 비우고 승인 사실은 남긴다).
  다만 3년 지난 데이터가 없어 미리보기가 0건이다 — "지워진다"를 눈으로 본 것이 아니다.
- **법무 확인.** 방침·약관 둘 다 변호사가 본 적이 없다.

## 개인정보처리방침 — 근거와 못 채운 값

원문 복구는 실패했다. 아임웹 호스팅이 만료됐고(`haddscience.imweb.me` → "사이트 기간 만료"),
웨이백에 남은 `?mode=privacy`(2025-07-12)는 본문을 JS 로 불러오는 껍데기라 조항이 없다.
NAS `08. 개인정보` 에도 홈페이지 방침 문서는 없다. 남은 길은 아임웹 관리자 로그인뿐이다.

그래서 **사이트가 실제로 하는 일**에서 조항을 만들었다. 각 항목의 근거:

| 조항 | 근거 |
|---|---|
| 수집 항목 | `contact-form.tsx` 의 입력 칸과 `route.ts` 가 Omnis 로 넘기는 본문 |
| 자동 수집(IP·UA) | `route.ts` 의 `clientIp()` 와 `user-agent` 헤더 |
| 문의가 처리되는 경로 | Omnis `WebsiteInquiry` — 승인 전까지 `orgId`·`contactId`·`quoteId` 가 null |
| 국외 이전 — 싱가포르 | Neon 호스트 `…ap-southeast-1.aws.neon.tech` (Omnis 세션 실측) |
| 국외 이전 — 서울에서 처리 | 양쪽 `vercel.json` 의 `regions: ["icn1"]` |
| 추적 안 함 | `gtag`·`analytics`·`clarity` 등 0건. `localStorage` 는 테마와 `/admin` 세션뿐 |

사람이 정한 값(2026-09-22): 보관기간 **3년**, 보호책임자 **대표 허채정**.

### 사이트 함수 리전을 서울로 고정한 이유

`vercel.json` 에 `regions` 가 없어 팀 기본 리전(미국)에서 돌고 있었다. 한국 이용자의
이름·연락처를 받는 라우트라 Omnis 와 같은 서울로 맞췄다. 이걸 고치지 않으면 방침의
"요청을 처리하는 서버가 서울 리전에 있습니다" 가 거짓이 된다.

### 이용약관도 함께 썼다

방침과 같은 자리표시였고, 사람이 같이 진행하라고 정했다. 회원가입·결제가 없는
소개·문의형 사이트에 맞춰 9절로 썼다. 두 문서 모두 "번역본과 한국어판이 다르면
한국어판이 우선한다" 를 넣었다.

### 고친 것 — Vercel 행의 보관 국가

처음에는 Vercel 행의 보관 국가를 "대한민국" 으로 적었다. Omnis 세션이 지적해 "미국 — 요청을
처리하는 서버는 서울 리전에 있습니다" 로 고쳤다.

`regions: ["icn1"]` 이 말하는 것은 **함수가 실행되는 리전**이지 로그가 쉬는 곳이 아니다.
바로 그 칸에 "접속 기록(IP 포함)이 로그로 남습니다" 라고 써 놓고 보관 국가를 대한민국이라고
하면, 그 로그에 대해 사실이 아닐 수 있다. 확인하지 않은 것을 유리한 쪽으로 적지 않는다.

### 법무 확인이 필요하다

이 두 문서는 실제 시스템에서 나온 사실로 채웠지만 변호사가 본 적이 없다.
공개 전에 확인을 받는 것이 맞다.

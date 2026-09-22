---
kind: decision
status: active
canonical: ../../omnis-local/mydocs/plans/2026-09-22-website-inquiry-to-crm.md
last_verified: 2026-09-22
---

# 2026-09-22 — 문의하기를 Omnis 견적으로 잇는다 (사이트 쪽)

> 스키마·API 의 권위는 Omnis 저장소 `mydocs/plans/2026-09-22-website-inquiry-to-crm.md` 다.
> 이 문서는 **사이트가 할 일과 두 저장소가 지킬 계약**만 적는다.
> 계약은 2026-09-22 에 Omnis 쪽과 네 곳을 고쳐 확정했다 — 아래 "계약" 절이 확정본이다.
> 실측은 [작업 결과](../working/2026-09-22-contact-to-omnis-inquiry.md).

## 문제

`/contact` 의 폼은 백엔드가 없다. 제출하면 `mailto:` 로 방문자의 메일 클라이언트를 열 뿐이라,
메일 앱이 없는 브라우저에서는 아무 일도 일어나지 않고 회사에는 기록이 남지 않는다.
Omnis 의 CRM(`CrmOrg` → `CrmContact` → `CrmQuote`)은 사람이 `/crm/quotes/new` 에서 손으로 채운다.
둘 사이에 다리가 없다.

## 핵심 결정 — 문의함을 한 층 둔다

문의 폼은 **아무나 입력할 수 있다.** 그래서 받은 것을 바로 `CrmOrg`·`CrmContact`·`CrmQuote` 에
넣지 않는다. `WebsiteInquiry` 라는 접수 전용 테이블에 먼저 쌓고, 사람이 승인해야 CRM 으로 넘어간다.

```
방문자 → [사이트] POST /api/contact → [Omnis] POST /api/website/inquiries
                                          ↓
                                    WebsiteInquiry (status=NEW)  ← CRM 아님
                                          ↓ Omnis 알림
                                    사람이 /crm/inquiries 에서 검토
                                          ↓ 승인할 때만
                                    CrmOrg · CrmContact · CrmQuote(DRAFT)
```

| 결정 | 선택 | 버린 안 |
|---|---|---|
| 저장 위치 | Omnis Neon `WebsiteInquiry` — CRM 테이블과 분리 | 바로 `CrmOrg` 생성 후 플래그 — 스팸 한 건이 기관 목록을 더럽히고, 되돌리려면 지워야 한다 |
| 전송 경로 | 브라우저 → **사이트 서버 라우트** → Omnis (서버 간, 공유 비밀) | 브라우저 → Omnis 직접(CORS) — Omnis 엔드포인트가 공개돼 봇이 직접 때린다 |
| 승인 시 | 기관 · 담당자 + **DRAFT 견적**까지 생성 (품목은 담당자가 채움) | 기관·담당자만 — 견적을 또 새로 열어야 한다 |
| 알림 | Omnis 알림 (`createNotification`) | 채팅방 글 · 메일 — 이번에는 안 한다 |
| 폼 필드 | 지금 그대로 (이름·소속·이메일·연락처·유형·내용·동의) | 제품·수량 칸 추가 — 이탈이 늘고, 담당자가 견적에서 어차피 정한다 |

비밀을 나누는 방식은 이미 있는 것과 같다 — `app/api/revalidate/route.ts` 의 `REVALIDATE_SECRET`
(Omnis 쪽 이름은 `WEBSITE_REVALIDATE_SECRET`). 이번에도 이름만 다른 같은 패턴이다.

## 계약 — 두 저장소가 지킬 것

### 1. 사이트 → Omnis : `POST {OMNIS_ORIGIN}/api/website/inquiries`

서버 간 호출. 브라우저에서 직접 부르지 않으므로 CORS 가 필요 없다.

```
Authorization: Bearer <WEBSITE_INQUIRY_SECRET>
Content-Type: application/json
```

```json
{
  "name": "홍길동",
  "organization": "○○대학교 ○○연구실",
  "email": "researcher@example.ac.kr",
  "phone": "010-0000-0000",
  "topic": "pricing",
  "message": "…",
  "lang": "ko",
  "ip": "1.2.3.4",
  "userAgent": "Mozilla/5.0 …"
}
```

- `topic` — `sample` · `pricing` · `technical` · `partnership` · `etc`. 그 밖은 400.
  `content/ko.ts` 의 `contact.form.topicOptions` 가 원본이다. **늘릴 때는 Omnis 를 먼저 배포한다.**
- `lang` — `ko` · `en` 만. 그 밖은 400.
- 길이 상한 — `name` 100 · `organization` 200 · `email` 200 · `phone` 50 · `message` 5000.
- `ip` · `userAgent` 는 사이트가 넘긴다. Omnis 는 서버 간 호출이라 방문자 IP 를 직접 볼 수 없다.
  IP 를 알 수 없으면 키를 **아예 뺀다**(빈 문자열이 아니라). Omnis 는 그때 IP 한도를 건너뛴다 —
  `null` 을 한 칸으로 묶으면 IP 를 못 넘긴 요청끼리 서로를 막는다.
- 필수: `name` · `email` · `message` · `topic`. 나머지는 빈 문자열/누락 허용.
- `consent` 는 보내지 않는다 — 동의 없이는 사이트가 애초에 보내지 않고, Omnis 가 재확인할 수단이 없다.
  동의 시각은 `createdAt` 이 곧 그것이다.

응답:

| 상태 | 본문 | 뜻 |
|---|---|---|
| 201 | `{ "ok": true, "id": "<uuid>" }` | 접수 |
| 200 | `{ "ok": true, "id": "<uuid>", "duplicate": true }` | 5분 안의 같은 문의. **사이트는 201 과 똑같이 다룬다** — 타임아웃 뒤 재시도와 더블클릭이 같은 문의를 둘로 쌓지 않게 하는 장치다 |
| 400 | `{ "error": "invalid_inquiry", "issues": ["…"] }` | 형식 오류 |
| 401 | `{ "error": "forbidden" }` | 비밀 불일치 |
| 429 | `{ "error": "rate_limited" }` | 같은 IP·이메일이 너무 잦음 |
| 503 | `{ "error": "unavailable" }` | DB 등 |

### 2. Omnis 가 할 일

Omnis 저장소에 계획서를 쓰고 거기서 확정한다. 사이트가 기대하는 것만 적는다.

1. `WebsiteInquiry` 모델 + `WebsiteInquiryStatus`(`NEW` · `ACCEPTED` · `REJECTED` · `SPAM`).
   `orgId` · `contactId` · `quoteId` 는 **승인 전까지 전부 null** — 이것이 "사람 검토" 의 실체다.
2. 위 엔드포인트. 레이트리밋은 인프라가 없으니 `WebsiteInquiry` 를 직접 센다
   (`ip` 10분 3건 · `email` 24시간 5건 초과 → 429). 세는 데 `status` 를 가리지 않는다 —
   검토자가 SPAM 으로 표시하는 순간 공격자의 한도가 되살아나면 안 된다.
   `WEBSITE_INQUIRY_SECRET` 이 비어 있으면 401 이 아니라 **503** 을 주고 아무것도 받지 않는다.
3. 새 문의 → `createNotification(userId, "website_inquiry", …, entityId=inquiry.id)`.
   수신자는 영업마케팅팀 + 대표(2026-09-22 확정). 클릭하면 `/crm/inquiries/{id}` 로 간다.
4. 검토 화면 `/crm/inquiries` — 목록(NEW 먼저) · 상세 · 승인 · 반려 · 스팸.
   승인은 기관을 기존에서 고르거나 새로 만들고, 담당자도 같은 방식으로, 그 뒤 DRAFT 견적을 만든다.
   **주의**: `lib/crm.ts` 의 `quoteCreateSchema` 는 `items.min(1)` 이라 품목 0개 견적을 막는다.
   이 경로는 별도 스키마가 필요하다.

## 사이트가 할 일

| # | 무엇 | 파일 |
|---|---|---|
| 1 | 서버 라우트 `POST /api/contact` — 검증 · 봇 거르기 · IP 추출 · Omnis 로 중계 | `app/api/contact/route.ts` (새로) |
| 2 | 폼을 `fetch` 제출로. 보내는 중 · 성공 · 실패 상태. 허니팟 · 체류시간 필드 | `components/forms/contact-form.tsx` |
| 3 | 실패 문구와 `mailto` 되돌림 링크 | `content/ko.ts` · `content/en.ts` · `content/types.ts` |

### 봇 거르기 (사이트 라우트에서)

- **허니팥** — 화면에 보이지 않는 `company` 입력. 채워져 있으면 버리고 **201 을 준다**.
  실패를 알려 주면 봇이 맞출 때까지 고친다.
- **체류시간** — 폼이 그려진 시각을 숨은 필드에 넣고, 제출까지 3초 미만이면 같은 방식으로 버린다.
- 사람이 실수로 걸릴 여지: 허니팟은 `aria-hidden` · `tabIndex={-1}` · `autoComplete="off"` 로
  자동완성과 스크린리더 양쪽에서 빠진다. 3초는 폼을 읽고 채우는 시간보다 짧다.

CAPTCHA 는 넣지 않는다 — 문의량이 적어 효과보다 이탈이 크고, 봇이 뚫어도 CRM 이 아니라
문의함에 쌓일 뿐이다. 실제로 스팸이 쌓이기 시작하면 그때 Vercel BotID 를 붙인다.

### 실패했을 때

Omnis 가 죽어도 문의를 잃지 않는다. 사이트 라우트가 502/503 을 주면 폼은
"지금 접수가 되지 않습니다. 메일로 보내 주세요" 와 함께 기존 `mailto:` 링크를 띄운다.
`mydocs/tech/content-storage.md` 의 불변식 1(사이트는 Omnis 가 죽어도 죽지 않는다)과 같은 태도다.

## 환경변수

| 이름 | 어디 | 값 |
|---|---|---|
| `INQUIRY_SECRET` | 사이트 (Vercel, 서버 전용) | Omnis 의 `WEBSITE_INQUIRY_SECRET` 과 같은 값 |
| `WEBSITE_INQUIRY_SECRET` | Omnis (Vercel) | 위와 같은 값 |
| `NEXT_PUBLIC_OMNIS_URL` | 사이트 | 이미 있다 (`lib/omnis-auth.ts`) |

`NEXT_PUBLIC_` 접두사를 쓰지 않는다 — 비밀이 번들에 들어가면 안 된다.

## 보관기간 — 3년 (2026-09-22 확정)

접수일로부터 3년. 전자상거래법의 소비자 불만·분쟁처리 기록 보관기간과 같은 길이로 맞췄다.
견적 상담으로 이어져 CRM 으로 옮겨간 건은 거래 기록으로서 별도 기간(상법·국세기본법)을 따른다.

**방침에 "3년 뒤 파기한다"고 쓴 이상 실제로 지우는 것이 있어야 한다.** 지금은 없다 —
Omnis 쪽 일로 올라가 있고, 공개 전에 서야 한다.

## 개인정보처리방침 — 쓴 뒤의 상태

`/ko/privacy` 는 아직 자리표시다. `content/ko.ts:99` 가 그렇게 말한다:

> 문의 폼에서 이름 · 이메일 · 연락처를 수집하므로, 공개 전에 현재 사이트의 개인정보처리방침
> 원문을 반드시 옮겨야 합니다.

지금까지는 폼이 `mailto:` 라 데이터가 회사 서버에 남지 않았다. 이 작업 뒤에는 이름 · 이메일 ·
연락처 · IP 가 Omnis DB 에 쌓인다.

2026-09-22 에 방침과 약관을 썼다. 옛 원문은 복구하지 못했다 — 아임웹 호스팅이 만료됐고
웨이백에 남은 캡처는 본문을 JS 로 불러오는 껍데기다. 그래서 **사이트가 실제로 하는 일**에서
조항을 만들었다. 근거와 못 채운 값은 [작업 결과](../working/2026-09-22-contact-to-omnis-inquiry.md)에 있다.
두 문서 모두 아직 법무 확인을 받지 않았다.

## 검증 기준

| 확인 | 방법 |
|---|---|
| 정상 접수 | 로컬 Omnis(`OMNIS_UPSTREAM=http://localhost:3000`)에 실제 POST → `WebsiteInquiry` 1건 · 알림 1건 |
| 허니팟 · 3초 | 두 경우 모두 201 이지만 DB 에 0건 |
| 길이 · 형식 | 이메일 형식 오류 · 5000자 초과 → 400 과 폼의 오류 문구 |
| 레이트리밋 | 같은 IP 로 11분간 4건 → 4번째 429, 폼이 사람이 읽을 문구를 띄움 |
| Omnis 다운 | Omnis 를 끄고 제출 → `mailto` 되돌림이 보이고 페이지가 죽지 않음 |
| 승인 흐름 | Omnis 세션이 검증 (기관·담당자·DRAFT 견적이 그때 처음 생기는지) |
| 품질 게이트 | `pnpm typecheck && pnpm lint && pnpm build` |

## 순서

1. Omnis 가 모델 · 엔드포인트 · 알림까지 (검토 화면은 그 뒤여도 된다) — 사이트가 부를 대상이 먼저 있어야 한다
2. 사이트가 라우트 · 폼 · 문구
3. 양쪽 환경변수 등록 → 프리뷰에서 왕복 확인
4. Omnis 검토 화면 · 승인 → 견적
5. ~~개인정보처리방침 원문~~ → 2026-09-22 작성 완료. 남은 것은 법무 확인

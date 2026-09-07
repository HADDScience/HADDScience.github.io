---
kind: snapshot
status: active
canonical: mydocs/plans/archives/2026-09-07-omnis-sso-and-db.md
last_verified: 2026-09-07
---

# 2026-09-07 — 카드뉴스 편집기 · Omnis SSO · 기사 Neon 이전 · 작업 결과

## 커밋 (main)

| 커밋 | 내용 |
|---|---|
| `986f4e1` | WISET 기사 (블록 형식 첫 글) |
| `1e0c5be` | 카드뉴스 편집기 |
| `917a99e` · `08a596d` | PAT → Omnis SSO, 한 도메인의 /omnis 로 |
| `9a40874` | 기사를 Omnis 에서 읽고 쓴다. 정적 export 해제 |
| `73604f0` `3108465` `c4b1e65` `cb70771` | Vercel 배포 함정 4개 (`mydocs/troubleshootings/vercel-deploy-traps.md`) |

## 실측

### 카드뉴스 편집기 (Playwright, GitHub API 목킹 — 당시는 git 이 DB)

```
9장 덱 저장 → 커밋 파일: card-01~09.webp (1080×1080) + thumb.webp (640) + JSON + order
PNG 내려받기 → test-deck-cardnews.zip 9장 1080×1080 RGBA
새 덱 + 사진 업로드 → src-01.webp 커밋, <b>강조</b> 파란 볼드 · 줄바꿈 정상
```

### SSO (Playwright, Omnis 목킹)

```
로그인 버튼 → authorize(app=website-admin-dev) → /admin/#sso=grant → redeem → 목록
주소창에서 #sso 제거됨 · localStorage 키 hadd.sso.session.website-admin-dev
새로고침 → verify → 목록 · 저장(API 경유) → 성공 · 나가기 → 로그인 화면, 저장소 비움
실제 Omnis 에 미등록 상태로 눌러 봄 → "등록되지 않은 앱입니다" 400 (등록 전 정상 거부)
```

### 기사 Neon 전환 (로컬 사이트 3123 → 로컬 Omnis 3000)

```
/ 307→/ko/ · /ko/news/ 200 · /ko/news/172288285/ 200 · /en/… 200
/omnis/api/website/media/172288285/01.webp 200 (RIFF) · /robots.txt 200 · /sitemap.xml 200
목록 사진 12장 로드 0 실패 · 상세 h1 "허채정 대표, 2026 WISET…" 사진 ok
관리 화면(Omnis API 목킹): 기존 글 재저장 → PUT src 유지 / 새 카드뉴스 사진 1 + 카드 3 + 썸네일 1 = 5 업로드(X-Post-Id) → PUT 본문 임시 경로 0개
/api/revalidate/ 비밀 없음 403 · 맞음 {"revalidated":true}
pnpm build: API 없을 때(빈 목록) 통과 · 로컬 API 일 때 통과 (59 페이지)
typecheck 0 · lint 0
```

### 배포 (Vercel `haddscience`, `vercel deploy --prod --yes` 5회)

| 회 | 결과 |
|---|---|
| 1 | 성공했으나 Next 페이지 전부 404 — 프로젝트 설정 Other(정적) |
| 2 | 빌드 실패 — 허브 빌드 Turbopack distDirRoot |
| 3 | 빌드 실패 — 같은 원인(turbopack.root 가 아니라 허브 쪽) |
| 4 | 성공. 페이지 200. 다만 `/omnis/` 404, API 경로 308 |
| 5 | 성공. 아래 전부 통과 |

```
/ 307→/ko/ · /ko/news/ 200 · /ko/news/20260827-1149/ 200 · /admin/ 200 · /omnis/ 200 · /omnis/login 200
/omnis/api/website/posts 200 (49건) · /omnis/api/website/media/172288285/01.webp 200
/.well-known/oauth-authorization-server 200 · /hub/ 200 · /robots.txt 200 (Disallow: / — DEPLOY_TARGET=pages) · /sitemap.xml 200
/api/revalidate/ 403 / 200 · 목록 사진 경로 24개
/omnis/sso/authorize?app=website-admin-vercel → 307 /omnis/login (등록됨)
```

## 추가 (저녁) — 사진 플레이스홀더

사진을 아직 안 넣은 카드도 레이아웃이 보이게 미리보기에 점선 자리를 그린다. 결과물에 찍히면 안 되므로
빈 자리(`is-empty`)는 기본 CSS 가 숨기고, 편집기의 `CardPreview` 만 `placeholders` 로 켠다.
standard · image-top · split · overlay · quote 다섯 레이아웃에서 비율 라벨("사진 4:3")과 함께 보이는 것을
스크린샷으로 확인했다. 굽는 무대는 이 클래스가 없어 CSS 상 숨겨진다 — PNG 를 직접 열어 확인하지는 못했다
(브라우저 도구가 끊겼다).

### 추가 (밤) — 텍스트 플레이스홀더 · 고아 줄 검사

텍스트 칸(배지·제목·부제·본문·각주·인용·이름·지표·항목)도 비어 있으면 같은 서체·크기의 회색 안내문이
미리보기에 보인다(`Slot`). 사진과 같은 `is-empty` 방식이라 결과물에는 없다.
줄바꿈 품질: `lib/cardnews-lint.ts` 가 그려진 줄을 글자 사각형으로 읽어 마지막 줄이 2글자 이하면 경고한다.

Playwright(omnis-local 의 패키지 · 시스템 Chrome)로 실측:
```
빈 카드 9종 미리보기 → 텍스트·사진 플레이스홀더 전부 표시 (스크린샷)
본문 수동 줄바꿈 "…찾아갔습니\n다"      → 경고 "본문의 마지막 줄에 "다" 만 남았습니다"
본문 긴 문장 자연 줄바꿈(끝에 "요")        → 경고 없음 — Chrome text-wrap: pretty 가 고아를 피해 줄을 다시 나눔
각주 긴 문장                              → 경고 없음 (balance)
빈 standard 카드 PNG 내려받기 → 카드 안 흰 픽셀 100%, 플레이스홀더 색 0 (안티앨리어싱 4픽셀)
```

## 확인하지 못한 것

실제 HADD 계정으로 `/admin` 로그인 → 기사 저장 → 사이트 반영. AI 에게 계정이 없다.
작업지시자가 한 번 해 보고 결과를 `mydocs/feedback/` 에 남기면 이 문서의 `last_verified` 를 올린다.

## 남은 것

- 옛 `content/data/news/` · `public/news/` 삭제 (승인 후)
- `haddscience.com` DNS → Vercel, `DEPLOY_TARGET=pages` 제거
- NAS 고아 사진 정리(Omnis 쪽), 카드뉴스 영문 자동 생성

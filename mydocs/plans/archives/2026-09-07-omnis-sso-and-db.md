---
kind: decision
status: active
canonical: mydocs/tech/content-storage.md
last_verified: 2026-09-07
---

# 2026-09-07 — `/admin` 을 Omnis SSO 에 붙이고 기사를 Neon 으로

> 이 저장소에는 당시 계획서 규약이 없었다. 계획과 승인은 Omnis 저장소에서 했다 —
> `mydocs/plans/archives/2026-09-07-website-admin-sso.md`(SSO, 프록시 부분은 폐기) 와
> `mydocs/plans/archives/2026-09-07-website-posts-db.md`(Neon). 이 문서는 사이트 쪽 결정만 기록한다.

## 결정

| 결정 | 선택 | 버린 안 |
|---|---|---|
| 로그인 | Omnis SSO(Hub 와 같은 클라이언트). 앱 id 는 오리진별 | GitHub PAT 유지 — 발급·갱신이 비개발자에게 벅참. Omnis 안으로 이식 — 2,500줄과 디자인 토큰을 두 벌로 |
| 기사 저장 | Omnis Neon. 사이트는 API 를 읽기만 | git 이 DB + Omnis 가 대신 커밋(GitHub 토큰) — 프록시까지 만들었다가 폐기 |
| 사이트 렌더 | 정적 export 해제, 서버 렌더 + ISR 60초 + 저장 시 재검증 | 정적 유지 + 재빌드 훅 — 반영 3~5분, 정적 배포 대상은 어차피 Vercel 로 통합됨 |
| 사진 | Synology NAS(Omnis 저장소) + 엣지 1년 캐시 | Vercel Blob — 저장소를 하나 더. Neon bytea — 사진이 늘수록 DB 가 무거워짐 |
| 카드뉴스 | 폼 입력형 · 9종 레이아웃 · 본문은 PNG 블록 | 자유 캔버스 — 브랜드가 흐트러지고 편집기가 제품이 됨 |

## 사이트가 한 일

1. `lib/omnis-auth.ts` (Hub 에서) · `hooks/use-admin-session.ts` SSO 흐름 · `components/admin/sign-in.tsx` 버튼 하나
2. `content/server.ts` 를 Omnis API fetch 로, 페이지 30여 곳 `await`
3. `lib/admin-posts.ts` 를 사진 업로드 → URL 치환 → PUT 으로. `lib/github.ts` 삭제
4. `next.config.ts` 정적 export 해제 · `/omnis` rewrite · 슬래시 리다이렉트 끔. `app/api/revalidate` · `robots.ts` · `sitemap.ts`
5. GitHub Pages 워크플로 · Synology 배포 · Actions 번역 스크립트 삭제

## 검증 기준

| 확인 | 방법 |
|---|---|
| 로그인 왕복 | Omnis 를 목킹한 Playwright: authorize → `#sso=` → redeem → 저장 → 새로고침 verify → 나가기 |
| 저장 순서 | 목킹된 API 가 받은 업로드(X-Post-Id)와 PUT 본문에 임시 경로가 0개 |
| 사이트 | 로컬 사이트 → 로컬 Omnis API 로 목록·상세·사진 |
| 배포본 | 실제 HTTP 로 전 경로 · 재검증 403/200 · 사진 200 |

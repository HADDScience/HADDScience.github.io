# CLAUDE.md

이 파일은 Claude Code 가 이 저장소의 권위 문서를 찾기 위한 **짧은 부트로더**다.
작업 절차와 규칙을 여기에 중복 기록하지 않는다. Omnis 저장소와 같은 구조다.

## 로딩 순서

1. [`AGENTS.md`](AGENTS.md) — 작업 규약 정본. 타스크 사이클 · 품질 게이트 · 배포
2. [`mydocs/README.md`](mydocs/README.md) — 문서 규약. frontmatter 네 칸의 뜻
3. [`README.md`](README.md) — 지금 어떻게 생겼는가 (구조 · 디자인시스템 · 결정)
4. 건드릴 영역의 canonical 문서 — 목록은 `AGENTS.md`
5. 오늘 작업 — `mydocs/orders/{yyyymmdd}.md`

**이 파일과 canonical 문서가 다르면 canonical 문서를 따른다.**

## 프로젝트

haddscience.com 홈페이지. Next.js 16 (App Router) · React 19 · Tailwind v4 · Vercel.
기사·사진은 Omnis(Neon · NAS)에 있고 이 사이트는 읽기만 한다. `/admin` 은 Omnis SSO 로 로그인한다.

## 자주 찾는 것

| 무엇 | 어디 |
|---|---|
| 기사가 어디서 오는가 | [`mydocs/tech/content-storage.md`](mydocs/tech/content-storage.md) |
| 배포에서 밟은 함정 | [`mydocs/troubleshootings/vercel-deploy-traps.md`](mydocs/troubleshootings/vercel-deploy-traps.md) |
| 비개발자용 사용법 | [`docs/콘텐츠-관리.md`](docs/콘텐츠-관리.md) |
| 품질 게이트 | `pnpm typecheck && pnpm lint && pnpm build` |

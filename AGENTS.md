<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---
kind: canonical
status: active
canonical: AGENTS.md
last_verified: 2026-09-07
---

# haddscience.com 작업 규약

Omnis 저장소의 `AGENTS.md` 와 같은 방법론(Hyper-Waterfall)을 따른다. 그쪽 문서가 규약의 원본이고,
여기는 이 저장소에 맞는 값만 적는다. 문서 규약은 [`mydocs/README.md`](mydocs/README.md).

## 문서 로딩 순서

1. 이 문서
2. [`mydocs/README.md`](mydocs/README.md)
3. 건드릴 영역의 canonical

   | 작업 | canonical |
   |---|---|
   | 기사 · 사진 · 관리 화면 저장 | [`mydocs/tech/content-storage.md`](mydocs/tech/content-storage.md) (권위는 Omnis) |
   | 인증 · SSO | Omnis `mydocs/tech/auth-architecture.md` |
   | 배포 | [`mydocs/troubleshootings/vercel-deploy-traps.md`](mydocs/troubleshootings/vercel-deploy-traps.md) · `README.md` "배포" |
   | 디자인시스템 · 컴포넌트 | `README.md` "디자인시스템 매핑" |

4. 오늘 작업 — `mydocs/orders/{yyyymmdd}.md`

## 타스크 사이클

```
1. 등록   작업지시자가 범위를 정한다        → mydocs/orders/{yyyymmdd}.md 에 한 줄
2. 계획   AI 가 수행 계획서 작성            → mydocs/plans/{yyyy-mm-dd}-{슬러그}.md
          작업지시자: 검토 → 승인 또는 수정      ← 승인 없이 3 으로 가지 않는다
3. 구현   단계별로 코드 + 검증                → 단계 끝마다 커밋
4. 검증   품질 게이트 + 범위별 게이트          → mydocs/working/{yyyy-mm-dd}-{슬러그}.md 에 실측 출력
5. 마감   작업지시자 승인 → main 머지 · 배포   → 계획서를 mydocs/plans/archives/ 로
```

계획서를 쓰는 기준: 되돌리기 어렵거나(배포 · 외부 게시 · 저장소 구조), 3개 이상 파일에 걸치거나,
코드만 봐서는 왜 그랬는지 알 수 없는 결정이 들어갈 때. 오탈자 · 한 줄 수정은 바로 커밋한다.
Omnis 와 함께 바뀌는 작업(스키마 · API · SSO)은 계획서를 Omnis 쪽에 쓰고 여기서는 가리킨다.

## 품질 게이트

```bash
pnpm typecheck && pnpm lint && pnpm build
```

| 변경 범위 | 추가로 |
|---|---|
| `content/types.ts` 의 `Post` | Omnis `lib/schemas/website.ts` 를 같이 고친다 |
| `/admin` | Omnis API 를 목킹한 Playwright 로 로그인 → 저장 흐름 |
| 페이지 · 컴포넌트 | `README.md` 의 디자인시스템 규칙 자가 점검 |
| 배포본 | 실제 HTTP 요청으로 전 경로. 화면 확인만으로는 부족하다 |

보고서에는 돌린 명령과 그 출력을 붙인다. 돌리지 않은 것을 "검증했다"고 쓰지 않는다.

## Git · 배포

- 커밋 메시지는 한국어 한 줄 요약 + 본문에 **왜**. 무엇을 했는지는 diff 가 말한다.
- 브랜치는 `feat/{주제}`. main 머지는 ff 로.
- **Vercel 은 git 푸시로 자동 배포되지 않는다.** `vercel deploy --prod --yes` 를 직접 돌린다.
- push · 배포 · 외부 게시는 작업지시자 승인 뒤. 다른 세션이 만든 변경은 임의로 되돌리지 않는다.
- 파일을 고치기 전에 먼저 읽는다. 태도를 문장으로 선언하지 않는다.

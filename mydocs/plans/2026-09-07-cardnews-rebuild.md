---
kind: decision
status: active
canonical: mydocs/tech/content-storage.md
last_verified: 2026-09-07
---

# 2026-09-07 — 옛 카드뉴스 10건을 새 레이아웃으로, 영문은 자동으로

## 결정

- **원칙:** 관리 화면에서는 한 언어만 쓴다. 다른 언어는 자동. 카드뉴스도 같다 — 저장할 때 영문 덱을 서버가 번역하고
  브라우저가 한 번 더 구워 `content.en` 에 넣는다 (Omnis `mydocs/plans/2026-09-07-website-deck-translate.md`).
- **검증 기준:** 픽셀 일치가 아니다. 원문 텍스트 전부 포함 · 고아 줄 0 · 넘침 0 (`lib/cardnews-lint.ts`).
  브라우저의 `text-wrap: balance/pretty` 가 대부분을 막고, 남는 것은 문장·줄바꿈을 고쳐 다시 렌더한다.
- **대상:** 이미지만 있는 옛 글 10건 · 82장. 한국어 카드를 새 카드로 **교체**하고 영문 카드를 추가한다. 덱을 남겨 다시 편집할 수 있게.
- **작업지시자 승인:** 채팅 "서브에이전트로 작업 진행해줘" (2026-09-07).

## 사이트가 할 일

| 무엇 | 어디 |
|---|---|
| 검사 페이지 — 덱 JSON 을 넣으면 카드를 전부 원본 크기로 그리고 카드별 문제를 보여준다. 자동화용 `window.__cardnews` 도 연다 | `app/admin/lint/page.tsx` |
| 편집기 — 저장 시 한국어 카드를 구운 뒤 번역 API 를 부르고 영문 덱을 한 번 더 구워 올린다 | `components/admin/deck-editor.tsx` |
| 옛 카드 82장 → 덱 JSON (텍스트 · 레이아웃 · 사진 자르기 좌표) | 스크래치 → `content/data/cardnews-rebuild/<id>.json` (검증 전까지) |

## 검증

- 검사 페이지: 덱을 넣으면 카드 수만큼 렌더, 고아 줄을 일부러 만든 덱에서 경고가 뜸
- 편집기: 목킹된 번역 API 로 저장 → 업로드에 en 카드가 포함되고 PUT 본문의 `content.en.blocks` 가 영문 alt 를 가짐
- 재작성: 10건 전부 문제 0, 원문 글자 대조표, 옛/새 카드 대조 스크린샷

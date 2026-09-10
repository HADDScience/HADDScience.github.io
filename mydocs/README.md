---
kind: canonical
status: active
canonical: mydocs/README.md
last_verified: 2026-09-07
---

# mydocs — 이 저장소의 문서 규약

Omnis 저장소의 `mydocs/` 와 같은 규약이다. 두 저장소가 한 도메인(haddscience.vercel.app) 아래
같은 사람들이 같은 방식으로 일하므로, 규약도 하나로 둔다. 원 출처는
[edwardkim/rhwp 의 mydocs](https://github.com/edwardkim/rhwp/tree/main/mydocs).

## 왜 이렇게 두는가

AI 와 함께 일할 때 가장 비싼 실수는 없는 사실을 지어내는 것이 아니라 **낡은 사실을 그대로
믿는 것**이다. 그래서 모든 문서가 자기 역할(`kind`)과 생존 상태(`status`)를 스스로 선언한다.
목차 파일은 두지 않는다 — 목차는 반드시 실제와 어긋난다.

`README.md`(개발자용 전체 설명)와 `docs/콘텐츠-관리.md`(비개발자용 사용법)는 이 규약 밖에
있다. 그 둘은 "지금 어떻게 생겼는가"를 말하고, `mydocs/` 는 "왜 그렇게 됐고 무엇을 확인했는가"를 말한다.

## frontmatter

`mydocs/` 아래 모든 마크다운은 다음 네 칸을 갖는다.

| 칸 | 뜻 | 값 |
|---|---|---|
| `kind` | 이 문서의 역할 | `canonical` `guide` `reference` `investigation` `decision` `snapshot` `memory` |
| `status` | 지금도 유효한가 | `active` `historical` `superseded` |
| `canonical` | 이 문서가 따르는 권위 문서의 경로 | 저장소 기준 상대경로 (자기 자신이 권위면 자기 경로) |
| `last_verified` | 본문의 사실을 마지막으로 확인한 날 | `YYYY-MM-DD` |

`kind` 고르는 법: `canonical` 최종 권위 · `guide` 절차 · `reference` 값과 표 · `investigation` 조사 중 ·
`decision` 무엇을 왜 골랐는지(뒤집히면 `superseded`) · `snapshot` 특정 시점의 상태 · `memory` 피드백.

## 디렉터리

| 경로 | kind | 담는 것 |
|---|---|---|
| `mydocs/tech/` | canonical · reference | 구조와 계약. 다른 저장소(Omnis)가 권위면 그쪽 경로를 가리키는 짧은 문서 |
| `mydocs/troubleshootings/` | reference | 걸렸던 문제와 푼 방법 |
| `mydocs/orders/{yyyymmdd}.md` | snapshot | 그날 할 일과 상태 |
| `mydocs/plans/` | decision | 수행 계획서. 끝나면 `plans/archives/` 로 |
| `mydocs/working/` | snapshot | 단계별·최종 결과와 **실측 출력** |
| `mydocs/feedback/` | memory | 사람이 쓴 피드백. AI 가 채우지 않는다 |

## 규칙

1. 문서를 옮기는 커밋은 옮기기만 한다.
2. 뒤집힌 결정은 지우지 않는다. `status: superseded` 로 바꾸고 `canonical` 을 새 문서로 돌린다.
3. `last_verified` 는 읽었다고 갱신하지 않는다. 본문의 사실을 실제로 확인했을 때만.
4. 본문에는 판단의 근거를 적는다. 무엇을 했는지는 git 이 안다.
5. 태도를 문장으로 선언하지 않는다. 한계는 사실로 적는다.

## 지금 있는 문서

| 경로 | kind | 무엇 |
|---|---|---|
| [tech/content-storage.md](tech/content-storage.md) | canonical | 기사·사진이 어디에 있고 사이트가 어떻게 읽는가 (권위는 Omnis) |
| [troubleshootings/vercel-deploy-traps.md](troubleshootings/vercel-deploy-traps.md) | reference | 정적 export → 서버 렌더로 옮기며 밟은 함정 |
| [working/2026-09-09-nav-narrow-overflow.md](working/2026-09-09-nav-narrow-overflow.md) | snapshot | 좁은 화면에서 헤더가 전 페이지를 47px 밀어내던 것 — 원인과 전후 실측 |

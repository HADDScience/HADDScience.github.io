---
kind: canonical
status: active
canonical: mydocs/tech/content-storage.md
last_verified: 2026-09-22
---

# 기사·사진 저장소와 사이트의 읽기 경로

**한 줄:** 기사는 Omnis 의 Neon(`WebsitePost`), 사진은 Synology NAS. 이 사이트는 읽기만 하고,
쓰기는 `/admin` 이 Omnis API 로 한다. 스키마·API 의 권위는 Omnis 저장소
`mydocs/plans/archives/2026-09-07-website-posts-db.md` 와 `lib/schemas/website.ts` 다.

| 무엇 | 어디 |
|---|---|
| 기사 본문·덱·순서·고정 | Omnis Neon `WebsitePost` |
| 사진 | NAS `/HADD Science/옴니스 첨부파일/files/website/<id>/<name>` · 목록은 `WebsiteMedia` |
| 사이트가 읽는 곳 | `content/server.ts` → `GET {OMNIS_API_BASE}/posts` (60초 캐시, 태그 `posts`) |
| 사진 URL | `/omnis/api/website/media/<id>/<name>` 상대 경로. `next.config.ts` 의 rewrite 가 Omnis 로 넘긴다 |
| 즉시 반영 | Omnis 가 저장·삭제 뒤 `POST /api/revalidate/` (비밀 `REVALIDATE_SECRET`) → 태그 `posts` 비움 |
| 관리 화면 쓰기 | `lib/admin-posts.ts` — 사진 `POST /media` → URL 치환 → `PUT /posts/<id>` |
| 고정 토글 | `PUT /posts/<id>/pin` `{ pinned }`. 기사 전체를 다시 쓰지 않는 전용 경로 |
| 로그인 | Omnis SSO (`lib/omnis-auth.ts`). 앱 id 는 오리진으로 고른다: `website-admin-vercel` · `website-admin` · `website-admin-com` |

## 목록 순서와 고정 (2026-09-22)

순서는 `position` 이고, 그 위에 `pinned` 가 **덧씌워진다**. Omnis 가
`[pinned desc, position asc, id desc]` 로 내려보내고 사이트는 받은 순서를 그대로 그린다 —
정렬 코드가 사이트에 없다.

고정을 순서 이동으로 흉내 내지 않는 이유: `position` 을 옮기면 **고정을 풀었을 때 원래 자리를
알 수 없다.** 실제로 2026-09-22 오전에 기사 하나를 손으로 `position 0` 으로 옮겼다가, 같은 날
기능을 만든 뒤 제자리(17)로 되돌리고 고정만 얹었다.

`pinned` 는 목록별로 센다(뉴스·하드:라이브러리 각각). 개수 제한은 없다.

`PostInput.pinned` 는 **선택**이다. 안 보내면 원래 값을 지킨다 — `category` 와 같은 이유로,
고정을 모르는 옛 관리 화면이 저장했다고 고정이 풀리면 안 된다.

## 관리 화면 로그인 — 왜 버튼이 있었나 (2026-09-22)

관리 화면 세션은 `haddscience.com` 의 `localStorage`(8시간), 옴니스 로그인은
`omnis.haddscience.com` 의 쿠키다. **오리진이 달라 여기서 저쪽이 살아 있는지 읽을 수 없다.**
확인하는 유일한 방법이 `/sso/authorize` 로 한 번 다녀오는 것이고, 「HADD 계정으로 로그인」
버튼이 하던 일이 정확히 그것이었다. 그래서 옴니스에 로그인돼 있으면 순식간에 돌아와
"세션이 살아 있는데 왜 누르지?" 로 보였다.

이제 세션이 없으면 자동으로 다녀온다(`hooks/use-admin-session.ts`). 무한 왕복 방지는
`sessionStorage` 의 `hadd.sso.auto-signin` — **탭당 한 번**. 로그인에 성공하면 표식을 풀고,
「나가기」를 누르면 표식을 남긴다(로그아웃한 사람을 곧바로 다시 들여보내면 로그아웃이 아니다).

## 불변식

1. **사이트는 Omnis 가 죽어도 죽지 않는다.** `listPosts` 가 실패하면 빈 목록. 뉴스만 빈다.
2. **사진 이름은 업로드마다 고유하다.** 그래서 `immutable` 캐시가 안전하고, 엣지가 NAS 를 가려 준다.
3. **`content/types.ts` 의 `Post` 와 Omnis `lib/schemas/website.ts` 는 같은 모양이어야 한다.** 한쪽만 바꾸면 사이트가 그리지 못하는 글이 저장된다.
4. **옛 `content/data/news/` · `public/news/` 는 읽지 않는다.** 실사용 확인 뒤 지운다.
5. **`pinned` 가 없는 응답은 `false` 로 읽는다.** 그래서 사이트가 Omnis 보다 먼저 배포돼도 목록이 깨지지 않는다.

## 지나온 길

- 2026-08-12 ~ 09-07: git 이 DB. 기사 JSON 과 사진을 저장소에 커밋, 정적 export 를 GitHub Pages · Synology 에.
- 2026-09-07: Omnis SSO 로 로그인을 옮기자 브라우저가 GitHub 토큰을 들 수 없게 됐다. 서버가 대신 커밋하게 하느니 DB 가 단순해 Neon 으로.
- 2026-09-22: `WebsitePost.pinned` 추가(Omnis PR #55) · 관리 화면 자동 로그인(사이트 PR #6).
  계획서는 Omnis 의 `mydocs/plans/archives/2026-09-22-website-post-pin.md`.

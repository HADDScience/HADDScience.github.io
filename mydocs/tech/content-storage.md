---
kind: canonical
status: active
canonical: mydocs/tech/content-storage.md
last_verified: 2026-09-07
---

# 기사·사진 저장소와 사이트의 읽기 경로

**한 줄:** 기사는 Omnis 의 Neon(`WebsitePost`), 사진은 Synology NAS. 이 사이트는 읽기만 하고,
쓰기는 `/admin` 이 Omnis API 로 한다. 스키마·API 의 권위는 Omnis 저장소
`mydocs/plans/archives/2026-09-07-website-posts-db.md` 와 `lib/schemas/website.ts` 다.

| 무엇 | 어디 |
|---|---|
| 기사 본문·덱·순서 | Omnis Neon `WebsitePost` |
| 사진 | NAS `/HADD Science/옴니스 첨부파일/files/website/<id>/<name>` · 목록은 `WebsiteMedia` |
| 사이트가 읽는 곳 | `content/server.ts` → `GET {OMNIS_API_BASE}/posts` (60초 캐시, 태그 `posts`) |
| 사진 URL | `/omnis/api/website/media/<id>/<name>` 상대 경로. `next.config.ts` 의 rewrite 가 Omnis 로 넘긴다 |
| 즉시 반영 | Omnis 가 저장·삭제 뒤 `POST /api/revalidate/` (비밀 `REVALIDATE_SECRET`) → 태그 `posts` 비움 |
| 관리 화면 쓰기 | `lib/admin-posts.ts` — 사진 `POST /media` → URL 치환 → `PUT /posts/<id>` |
| 로그인 | Omnis SSO (`lib/omnis-auth.ts`). 앱 id 는 오리진으로 고른다: `website-admin-vercel` · `website-admin` · `website-admin-com` |

## 불변식

1. **사이트는 Omnis 가 죽어도 죽지 않는다.** `listPosts` 가 실패하면 빈 목록. 뉴스만 빈다.
2. **사진 이름은 업로드마다 고유하다.** 그래서 `immutable` 캐시가 안전하고, 엣지가 NAS 를 가려 준다.
3. **`content/types.ts` 의 `Post` 와 Omnis `lib/schemas/website.ts` 는 같은 모양이어야 한다.** 한쪽만 바꾸면 사이트가 그리지 못하는 글이 저장된다.
4. **옛 `content/data/news/` · `public/news/` 는 읽지 않는다.** 실사용 확인 뒤 지운다.

## 지나온 길

- 2026-08-12 ~ 09-07: git 이 DB. 기사 JSON 과 사진을 저장소에 커밋, 정적 export 를 GitHub Pages · Synology 에.
- 2026-09-07: Omnis SSO 로 로그인을 옮기자 브라우저가 GitHub 토큰을 들 수 없게 됐다. 서버가 대신 커밋하게 하느니 DB 가 단순해 Neon 으로.

---
kind: reference
status: active
canonical: mydocs/troubleshootings/vercel-deploy-traps.md
last_verified: 2026-09-23
---

# 정적 export 를 서버 렌더로 옮기며 밟은 함정 (2026-09-07)

전부 한 번씩 실제로 겪고 고친 것이다.

## Vercel 프로젝트 설정이 "Other" 면 Next 페이지가 전부 404

정적 export 시절 `vercel.json` 에 `framework: null` · `outputDirectory: "out"` 을 뒀고, 프로젝트 설정도
Framework Preset = Other 였다. `output: "export"` 를 빼고 그 두 줄만 지우자 배포는 성공했는데 `public/` 만
서빙돼 모든 페이지가 404 였다(`/hub/` 와 `.well-known` 만 200). **대응:** `vercel.json` 에
`"framework": "nextjs"` 를 명시한다. 프로젝트 설정은 대시보드에 있어 코드로 못 바꾸므로 파일이 이겨야 한다.

## 허브 빌드가 Vercel 의 outputFileTracingRoot 를 물려받아 Turbopack 이 죽는다

`scripts/build-hub.sh` 가 허브를 `/tmp` 에 받아 `next build` 하는데, Vercel 의 Next 빌더가 환경변수로
`outputFileTracingRoot=/vercel/path0` 를 주입한다. `/tmp` 는 그 밖이라
`Invalid distDirRoot: ".next". distDirRoot should not navigate out of the projectPath` 로 죽었다.
정적 export 시절엔 프레임워크가 Other 라 그 주입이 없었다. **대응:** 허브 빌드를 `env -i PATH HOME NEXT_PUBLIC_*` 로 돌린다.

(2026-09-08 이후로는 걸릴 일이 없다. 허브가 자기 Vercel 프로젝트 `hadd-hub` 로 옮겨가면서
`scripts/build-hub.sh` 를 지웠다 — 이 사이트는 `/hub/*` 를 그 프로젝트로 rewrite 만 한다.)

## Next 가 앞에 서면 vercel.json 의 rewrite 가 [lang] 에 진다

`/omnis/*` 를 Omnis 로 넘기는 rewrite 를 `vercel.json` 에 뒀는데, Next 가 라우트를 먼저 보고 `[lang]` 이
`/omnis/` 를 받아 404 를 냈다. **대응:** `next.config.ts` `rewrites().beforeFiles` 로 옮긴다.
`.well-known` 도 같이. `vercel.json` 에는 framework 와 buildCommand 만 남는다.

## trailingSlash 가 API 경로에도 308 을 건다

`trailingSlash: true` 라 `/omnis/api/website/posts` → `/posts/` 로 308. 브라우저는 따라가지만
관리 화면의 PUT 이 한 번 더 왕복한다. **대응:** `skipTrailingSlashRedirect: true`. 페이지 주소는 그대로 슬래시다.

## 로컬의 turbopack.root 를 Vercel 에서도 쓰면 안 된다

상위 디렉터리 lockfile 때문에 로컬에서 `turbopack.root` 를 고정했는데, Vercel 에서는 이 값이 "projectPath 밖"
으로 판정된다(위 허브 오류와 같은 메시지). **대응:** `process.env.VERCEL` 이 없을 때만 설정한다.

## ~~이 프로젝트는 git 푸시로 자동 배포되지 않는다~~ — 지금은 푸시가 곧 배포다 (2026-09-15 정정)

2026-09-08 에 Vercel 프로젝트를 이 저장소에 연결하면서 뒤집혔다. **`main` 푸시가 곧 배포다.**
다른 브랜치와 PR 은 프리뷰 주소를 받는다. 실측 — 2026-09-09~10 의 세 커밋이 모두 자동으로 나갔다:

```
fcb7d38  fix(nav)   → haddscience-4zp2cxkoe  Ready 46s
e41b4bf  docs(nav)  → 배포됨
efcad52  docs(agents) → haddscience-nfqxe3808  Ready 45s
```

**Omnis 도 마찬가지다.** 여기 "Omnis 와 같다"고 적어 둔 것이 두 저장소 모두에서 틀렸다.

```
$ gh api repos/HADDScience/omnis/deployments
2026-09-10T01:33:18Z  Production  4b42620
2026-09-10T01:31:49Z  Preview     985f6d5
```

`vercel deploy --prod --yes` 로 손으로 올릴 수도 있지만 **커밋하지 않은 것까지 올라간다** —
다른 세션의 미커밋 변경이 있으면 검증하지 않은 남의 작업이 운영에 나간다. 기본은 푸시다.

옛 문장을 지우지 않고 남기는 이유: 2026-09-08 이전 기록을 읽을 때 그때는 사실이었다는 것이
보여야 한다.

## 카드뉴스: 글이 길면 사진이 소리 없이 눌려 잘렸다 (2026-09-08)

옛 카드뉴스를 새 레이아웃으로 옮긴 뒤 한 카드의 사진에서 현수막 글자가 사라졌다. 사진 상자 비율(4:3)은 맞았는데,
카드가 세로 flex 이고 `.imgbox` 에 `flex: none` 이 없어 **본문이 길면 상자가 세로로 눌리고** `object-fit: cover` 가
위아래를 잘라냈다. 넘침 검사는 넘치지 않으니 조용했다. 전수조사하니 10건 중 9건 · 29장이 같은 상태였다.

**대응:** `.imgbox { flex: none }` — 눌리는 대신 넘치게 해서 검사에 걸리게. 그리고 옛 카드가 그랬듯 글이 길면
사진을 작게 넣는다: `image.width`(100 · 80 · 65 · 50 %) 옵션을 스키마 · 렌더러 · 편집기에 추가하고, 재작성
스크립트는 넘칠 때 폭 → 비율 → 제목 크기 → 수동 줄바꿈 풀기 순으로 물러난다. 사진 상자 비율은 사진의 실제
비율에 가장 가까운 것을 고른다.

## 재작성 스크립트가 같은 파일 이름을 다시 쓰면 아무것도 안 바뀐다

두 번째 실행에서 `rebuild-ko-03.webp` 같은 이름을 그대로 써서 `storeMedia` 가 "이미 있음"으로 넘겼고, 엣지는
같은 URL 을 1년 캐시한다. 실서비스 사진이 옛것 그대로였다(픽셀 차 29.0). **대응:** 실행마다 타임스탬프를 이름에
넣고, 그 글의 이전 `rebuild-*` 파일을 NAS 와 목록에서 지운 뒤 올린다.

## Gemini: thinking 이 출력 한도를 먹어 긴 덱 번역이 끊긴다 · "현장" 을 "現場" 로 쓴다

`maxOutputTokens: 8192` 에 thinking 토큰이 포함돼 긴 덱의 JSON 이 중간에 끊겼다. thinking 을 0 으로 끄면 응답은
완성되지만 "현장 확인하기" 를 "symposium現場" 로 쓰는 오역이 고정됐다. **대응(Omnis):** 번역 엔드포인트는
thinkingBudget 1024, JSON 파싱 실패 시 최대 3회 재시도, 영문 결과에 한글·한자가 남은 칸은 예시("venue · on site ·
scene")를 주며 다시 시키고, 그래도 남으면 알려진 오역만 손으로 치환. 재작성 보고서는 영문 덱의 한글·한자 잔여를
"남은 문제"로 센다.

## 업스트림이 죽은 동안 빌드가 돌면 사이트맵이 빈 채로 굳는다 (2026-09-23)

기사는 Omnis API 에서 온다. `listPosts()` 는 실패하면 **빈 배열을 돌려준다** — 뉴스 한
섹션 때문에 홈페이지 전체가 500 으로 죽지 않게 한 설계다(`content/server.ts`). 그래서
Omnis 가 죽어 있는 동안 배포가 돌면 **기사 0건짜리 정적 산출물**이 구워진다.

2026-09-23 에 실제로 그랬다. Omnis 의 Neon 이 무료 한도를 넘겨 posts API 가 500 이었고,
그 시각에 배포가 나갔다. 업스트림이 살아난 뒤 화면은 이렇게 갈렸다.

| | 복구 방식 | 결과 |
|---|---|---|
| 뉴스·라이브러리 목록 | ISR (`x-nextjs-stale-time: 300`) | 몇 분 안에 저절로 돌아왔다 |
| 쪽나누기 `/news/page/2` | 같음 | 404 → 200 으로 돌아왔다 |
| `/feed.xml` | 요청 시점 렌더 | 애초에 데이터 캐시의 옛 응답을 써서 비지 않았다 |
| **`/sitemap.xml`** | — | **8분 넘게 `x-vercel-cache: HIT` (age 311) 로 22개에 고정** |

사이트맵은 쿼리스트링·`Cache-Control: no-cache` 로도 갱신되지 않았다. 다시 배포해서
해결했다. 빌드 출력의 revalidate 표시는 `1m` 이지만 그대로 굳어 있었다 — 정적(`○`)
라우트라 목록 페이지(`●`)와 복구 경로가 다르다.

**교훈: 업스트림이 죽은 것을 알면서 배포하지 않는다.** 이미 나갔다면 업스트림 복구 뒤
`/sitemap.xml` 의 `<loc>` 수를 직접 세어 보고, 그대로면 다시 배포한다.

```bash
curl -s https://haddscience.com/sitemap.xml | grep -c "<loc>"   # 정상이면 300+
```

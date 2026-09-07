---
kind: reference
status: active
canonical: mydocs/troubleshootings/vercel-deploy-traps.md
last_verified: 2026-09-07
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

## 이 프로젝트는 git 푸시로 자동 배포되지 않는다

`main` 을 푸시해도 Vercel 이 빌드하지 않는다. `vercel deploy --prod --yes` 를 직접 돌린다. Omnis 와 같다.

#!/usr/bin/env bash
# 허브(HADDScience/hub)를 받아 빌드해 public/hub 에 넣는다. `next build` 전에 돈다.
#
# haddscience.vercel.app 은 한 프로젝트(이 저장소)가 루트를 맡고, 허브는 정적 export 라
# 그 안에 폴더 하나로 들어간다 — Vercel 프로젝트를 둘로 쪼개고 rewrite 로 잇는 것보다
# 단순하다. 이 사이트가 정적 export 를 그만두면서 out/ 이 없어져 public/ 으로 옮겼다.
# Next 는 public/ 을 그대로 서빙하므로 /hub/… 가 파일 그대로 나간다.
#
# 허브의 NEXT_PUBLIC_* 는 빌드 시 번들에 박힌다. 비밀은 없다 — 발급자 주소와 앱 id 뿐이다.
# 허브가 어느 Omnis 로 로그인을 보낼지는 HUB_OMNIS_URL 로, 앱 id 는 HUB_SSO_APP_ID 로 바꾼다.
# (기본: 같은 도메인의 /omnis · id hub-vercel — Omnis 의 lib/sso.ts 에 그 오리진으로 등록돼 있다)
set -euo pipefail
cd "$(dirname "$0")/.."

REF="${HUB_REF:-main}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "hub: HADDScience/hub@$REF 받는 중"
git clone --quiet --depth 1 --branch "$REF" https://github.com/HADDScience/hub.git "$WORK/hub"

cd "$WORK/hub"
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile --silent
# Vercel 의 Next 빌더는 환경변수로 이 프로젝트의 outputFileTracingRoot(/vercel/path0)를
# 주입한다. 허브는 /tmp 에서 빌드되므로 그 값을 물려받으면 "distDir 가 projectPath 밖"
# 이라며 Turbopack 이 죽는다. 허브 빌드는 빈 환경에서 돌린다 — 필요한 건 PATH 와 아래 셋뿐.
env -i PATH="$PATH" HOME="$HOME" \
  NEXT_PUBLIC_OMNIS_URL="${HUB_OMNIS_URL:-https://haddscience.vercel.app/omnis}" \
  NEXT_PUBLIC_SSO_APP_ID="${HUB_SSO_APP_ID:-hub-vercel}" \
  NEXT_PUBLIC_BASE_PATH=/hub \
  pnpm build

cd - >/dev/null
rm -rf public/hub
cp -R "$WORK/hub/out" public/hub
echo "hub: public/hub 에 $(find public/hub -type f | wc -l | tr -d ' ')개 파일"

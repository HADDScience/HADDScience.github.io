#!/usr/bin/env bash
# 허브(HADDScience/hub)를 받아 빌드해 out/hub 에 넣는다.
#
# haddscience.vercel.app 은 한 프로젝트(이 저장소)가 루트를 맡고, 허브는 정적 export 라
# 그 안에 폴더 하나로 들어간다 — Vercel 프로젝트를 둘로 쪼개고 rewrite 로 잇는 것보다
# 단순하고, GitHub Pages 에서 org 사이트 아래 /hub 로 두던 모양과 같다.
#
# 허브의 NEXT_PUBLIC_* 는 빌드 시 번들에 박힌다. 비밀은 없다 — 발급자 주소와 앱 id 뿐이다.
# 허브가 어느 Omnis 로 로그인을 보낼지는 HUB_OMNIS_URL 로 바꾼다 (기본: 지금 옴니스 주소).
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
NEXT_PUBLIC_OMNIS_URL="${HUB_OMNIS_URL:-https://omnis-hadd.vercel.app}" \
NEXT_PUBLIC_SSO_APP_ID=hub \
NEXT_PUBLIC_BASE_PATH=/hub \
  pnpm build

cd - >/dev/null
rm -rf out/hub
mkdir -p out
cp -R "$WORK/hub/out" out/hub
echo "hub: out/hub 에 $(find out/hub -type f | wc -l | tr -d ' ')개 파일"

#!/usr/bin/env bash
#
# 정적 산출물 out/ 을 Synology Web Station 폴더로 동기화한다.
#
#   export HADD_DEPLOY_HOST=admin@nas.example.com
#   export HADD_DEPLOY_PATH=/volume1/web/haddscience
#   pnpm build && ./scripts/deploy-synology.sh
#
# rsync --delete 를 쓰므로 대상 경로에 out/ 에 없는 파일이 있으면 지워진다.
# 그래서 실행 전에 대상과 규모를 보여주고 확인을 받는다.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/out"

: "${HADD_DEPLOY_HOST:?HADD_DEPLOY_HOST 를 설정할 것 (예: admin@nas.example.com)}"
: "${HADD_DEPLOY_PATH:?HADD_DEPLOY_PATH 를 설정할 것 (예: /volume1/web/haddscience)}"

if [[ ! -d "$OUT" ]]; then
  echo "out/ 이 없다. 먼저 'pnpm build' 를 실행할 것." >&2
  exit 1
fi

# 빌드 산출물이 온전한지 최소 확인. postbuild 가 만드는 것들이다.
for required in index.html .nojekyll ko/index.html en/index.html _next; do
  if [[ ! -e "$OUT/$required" ]]; then
    echo "out/$required 가 없다. 빌드가 중간에 실패한 것으로 보인다." >&2
    exit 1
  fi
done

FILES=$(find "$OUT" -type f | wc -l | tr -d ' ')
SIZE=$(du -sh "$OUT" | cut -f1)

cat <<INFO

  대상 서버 : $HADD_DEPLOY_HOST
  대상 경로 : $HADD_DEPLOY_PATH
  올릴 내용 : $FILES 개 파일 / $SIZE

  주의: 대상 경로에서 out/ 에 없는 파일은 삭제된다 (rsync --delete).

INFO

read -r -p "진행할까? (yes 입력) " answer
if [[ "$answer" != "yes" ]]; then
  echo "취소했다."
  exit 0
fi

rsync -az --delete --human-readable --stats \
  --exclude ".DS_Store" \
  "$OUT/" "$HADD_DEPLOY_HOST:$HADD_DEPLOY_PATH/"

echo
echo "완료. https://haddscience.com 에서 확인할 것."
echo "브라우저 캐시 때문에 옛 화면이 보이면 강제 새로고침(Cmd+Shift+R)."

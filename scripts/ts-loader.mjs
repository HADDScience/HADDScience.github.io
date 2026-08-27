/**
 * content/*.ts 를 Node 에서 직접 불러오기 위한 최소 로더.
 *
 *   node --experimental-strip-types --import ./scripts/ts-loader.mjs <script>
 *
 * Next 는 확장자 없는 상대 임포트(`./ko`)를 해석해 주지만 Node 는 그러지 않는다.
 * 빌드 도구를 하나 더 들이는 대신 이 열 줄로 해결한다. 마이그레이션·번역처럼
 * 빌드 밖에서 콘텐츠를 읽어야 하는 스크립트에서만 쓴다.
 */
import { register } from "node:module"
import { pathToFileURL } from "node:url"

register("./scripts/ts-resolver.mjs", pathToFileURL("./"))

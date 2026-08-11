import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /**
   * 정적 export. GitHub Pages 와 Synology Web Station 에 같은 `out/` 을 올린다.
   * 서버 런타임이 없으므로 `proxy.ts` 는 `pnpm dev` 에서만 동작한다. 정적 배포에서
   * `/` → `/ko` 리다이렉트는 `scripts/postbuild.mjs` 가 만드는 out/index.html 이 담당한다.
   */
  output: "export",

  // 상위 디렉터리의 lockfile 때문에 워크스페이스 루트가 홈 디렉터리로 잘못 추론된다.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },

  images: {
    // 정적 export 에서는 온디맨드 최적화가 불가능하다. 대신 빌드 전에 sharp 로
    // 미리 리사이즈해 둔다 (scripts/fetch-news-media.mjs, public/products/*).
    unoptimized: true,
  },

  // /ko/ 처럼 디렉터리로 해석되는 경로를 out/ko/index.html 로 만들어 준다.
  // 정적 호스팅(GitHub Pages, Web Station) 기본 동작과 맞다.
  trailingSlash: true,
}

export default nextConfig

import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /**
   * 정적 export 를 쓰지 않는다 (2026-09-07). 기사가 Omnis 의 DB 에서 오므로 뉴스 페이지는
   * 서버에서 렌더하고 ISR 로 캐시한다. `proxy.ts` 가 `/` → `/ko` 를 맡는다.
   * 배포는 Vercel(haddscience) 하나다 — GitHub Pages · Synology 는 정적 산출물이 없어 끝났다.
   */

  // 상위 디렉터리의 lockfile 때문에 워크스페이스 루트가 홈 디렉터리로 잘못 추론된다.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },

  images: {
    // 최적화를 켜지 않는다. 사진은 관리 화면이 올릴 때 이미 1600px webp 로 줄여 두고,
    // 기사 사진 경로(/omnis/api/website/media/…)는 rewrite 로 Omnis 에서 오는 것이라
    // 최적화기가 다시 받아 오면 NAS 왕복이 한 번 더 생긴다.
    unoptimized: true,
  },

  /**
   * 로컬 개발에서만 /omnis/* 를 Omnis 로 넘긴다. 사진 경로가 `/omnis/api/website/media/…`
   * 상대 경로라서다. 배포에서는 vercel.json 의 rewrite 가 같은 일을 한다.
   */
  async rewrites() {
    if (process.env.NODE_ENV === "production") return []
    const omnis = process.env.OMNIS_DEV_ORIGIN ?? "http://localhost:3000"
    return [{ source: "/omnis/:path*", destination: `${omnis}/:path*` }]
  },

  // /ko/ 처럼 디렉터리로 해석되는 경로를 out/ko/index.html 로 만들어 준다.
  // 정적 호스팅(GitHub Pages, Web Station) 기본 동작과 맞다.
  trailingSlash: true,
}

export default nextConfig

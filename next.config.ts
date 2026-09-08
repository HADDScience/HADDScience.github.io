import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /**
   * 정적 export 를 쓰지 않는다 (2026-09-07). 기사가 Omnis 의 DB 에서 오므로 뉴스 페이지는
   * 서버에서 렌더하고 ISR 로 캐시한다. `proxy.ts` 가 `/` → `/ko` 를 맡는다.
   * 배포는 Vercel(haddscience) 하나다 — GitHub Pages · Synology 는 정적 산출물이 없어 끝났다.
   */

  // 상위 디렉터리의 lockfile 때문에 워크스페이스 루트가 홈 디렉터리로 잘못 추론된다.
  // 로컬에서만 고정한다 — Vercel 빌드에서는 이 값이 "projectPath 밖" 으로 판정돼 빌드가 죽는다.
  ...(process.env.VERCEL ? {} : { turbopack: { root: path.resolve(import.meta.dirname) } }),

  images: {
    // 최적화를 켜지 않는다. 사진은 관리 화면이 올릴 때 이미 1600px webp 로 줄여 두고,
    // 기사 사진 경로(/omnis/api/website/media/…)는 rewrite 로 Omnis 에서 오는 것이라
    // 최적화기가 다시 받아 오면 NAS 왕복이 한 번 더 생긴다.
    unoptimized: true,
  },

  /**
   * /omnis/* 는 Omnis 로, /hub/* 는 허브(Vercel 프로젝트 hadd-hub)로 넘긴다. 사이트·관리 화면·사진 경로가 전부 같은 도메인의
   * /omnis 를 보기 때문이다. vercel.json 의 rewrite 는 Next 가 라우트를 다 본 뒤에야
   * 적용되는데 `[lang]` 이 /omnis 를 먼저 받아 404 를 냈다. 그래서 beforeFiles 로 둔다.
   * MCP 디스커버리(.well-known)는 규격상 호스트 루트에 있어야 해서 여기서 Omnis 로 넘긴다.
   */
  async rewrites() {
    const omnis =
      process.env.OMNIS_UPSTREAM ??
      (process.env.NODE_ENV === "production"
        ? "https://omnis-hadd.vercel.app/omnis"
        : "http://localhost:3000")
    const mcp = `${omnis}/api/ip-mcp/.well-known`

    // 허브는 예전엔 빌드 때 받아 public/hub 에 복사해 넣는 사본이었다. 그래서 허브를
    // 고쳐도 이 사이트를 다시 배포하기 전엔 아무것도 안 바뀌었다. 이제 허브는 자기
    // Vercel 프로젝트(hadd-hub)에서 자기 저장소의 main 을 보고 배포되고, 여기서는
    // 주소만 빌려준다. rewrite 여야 한다 — redirect 로 바꾸면 오리진이 hadd-hub 로
    // 드러나면서 Omnis 의 hub-vercel 등록(origin haddscience.vercel.app)과 어긋나
    // 로그인이 막히고, /hub/?next= 로 넘어오는 툴들도 같이 끊긴다.
    const hub = process.env.HUB_UPSTREAM ?? "https://hadd-hub.vercel.app/hub"

    return {
      beforeFiles: [
        { source: "/omnis", destination: omnis },
        { source: "/omnis/:path*", destination: `${omnis}/:path*` },
        { source: "/hub", destination: hub },
        { source: "/hub/:path*", destination: `${hub}/:path*` },
        { source: "/.well-known/oauth-authorization-server/omnis/api/ip-mcp", destination: `${mcp}/oauth-authorization-server` },
        { source: "/.well-known/oauth-protected-resource/omnis/api/ip-mcp", destination: `${mcp}/oauth-protected-resource` },
        { source: "/.well-known/oauth-authorization-server", destination: `${mcp}/oauth-authorization-server` },
        { source: "/.well-known/oauth-protected-resource", destination: `${mcp}/oauth-protected-resource` },
      ],
    }
  },

  // /omnis/api/… 같은 API 경로에 끝 슬래시 리다이렉트(308)가 걸리지 않게 한다.
  // 페이지 주소는 여전히 /ko/ 처럼 슬래시로 만든다(아래 trailingSlash).
  skipTrailingSlashRedirect: true,

  // /ko/ 처럼 디렉터리로 해석되는 경로를 out/ko/index.html 로 만들어 준다.
  // 정적 호스팅(GitHub Pages, Web Station) 기본 동작과 맞다.
  trailingSlash: true,
}

export default nextConfig

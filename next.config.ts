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
   * 아임웹 시절 주소 → 새 페이지. haddscience.com 의 DNS 를 이 프로젝트로 옮기면 검색 결과와
   * 공유된 기사 링크가 전부 옛 주소로 들어온다. proxy.ts 의 언어 접두사보다 먼저 돌아야
   * `/Team` 이 `/ko/Team`(404)으로 가지 않는다 — next.config 의 redirects 가 proxy 보다 앞선다.
   * 목록은 2026-09-17 아임웹 sitemap.xml 과 메뉴에서 뽑았다. 기사 번호는 이전할 때 그대로 뒀다.
   */
  async redirects() {
    const to = (source: string, destination: string) => ({ source, destination, permanent: true })
    const idx = [{ type: "query" as const, key: "idx", value: "(?<idx>\\d+)" }]
    const board = [...idx, { type: "query" as const, key: "bmode", value: "view" }]
    return [
      /**
       * www 는 대표 주소(haddscience.com)로 보낸다. 둘 다 200 을 주면 검색엔진이 같은 글을 둘로 세고,
       * Omnis SSO 는 오리진마다 앱이 따로라 www 에서는 관리 화면 로그인이 막힌다(등록은 apex 뿐).
       * 경로·쿼리를 그대로 들고 간다. 아임웹은 반대로 apex → www 였다.
       */
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.haddscience.com" }],
        destination: "https://haddscience.com/:path*",
        permanent: true,
      },
      /**
       * 허브는 2026-09-18 에 자기 서브도메인 루트로 나갔다(그전에는 여기 /hub 아래에 rewrite 로
       * 얹혀 살았다). 북마크와 다른 툴의 `?next=` 가 옛 주소를 들고 있으므로 그대로 보낸다.
       */
      { source: "/hub", destination: "https://hub.haddscience.com/", permanent: true },
      { source: "/hub/:path*", destination: "https://hub.haddscience.com/:path*", permanent: true },
      // 기사: /?…&bmode=view&idx=N · /news/?bmode=view&idx=N
      { source: "/", has: board, destination: "/ko/news/:idx/", permanent: true },
      { source: "/news", has: board, destination: "/ko/news/:idx/", permanent: true },
      { source: "/noticeall", has: board, destination: "/ko/news/:idx/", permanent: true },
      // 약관
      { source: "/", has: [{ type: "query", key: "mode", value: "privacy" }], destination: "/ko/privacy/", permanent: true },
      { source: "/", has: [{ type: "query", key: "mode", value: "policy" }], destination: "/ko/terms/", permanent: true },
      // 메뉴
      to("/main", "/ko/"),
      to("/56", "/ko/about/"),
      to("/Team", "/ko/about/team/"),
      to("/team", "/ko/about/team/"),
      to("/Location", "/ko/about/location/"),
      to("/location", "/ko/about/location/"),
      to("/product", "/ko/products/"),
      to("/addgelproduct", "/ko/products/"),
      to("/51", "/ko/products/"),
      to("/53", "/ko/products/"),
      to("/57", "/ko/products/livegel/"),
      to("/haddlibrary", "/ko/library/"),
      to("/news", "/ko/news/"),
      to("/noticeall", "/ko/news/"),
      to("/en-main", "/en/"),
      to("/en-about", "/en/about/"),
      to("/en-team", "/en/about/team/"),
      to("/en-location", "/en/about/location/"),
      to("/en-contact", "/en/contact/"),
      // 새 사이트에 짝이 없는 페이지는 첫 화면으로
      ...["/Project", "/rnd", "/partners", "/FAQ", "/userguide", "/userguide01", "/userguide03", "/64", "/65", "/footer"].map((s) =>
        to(s, "/ko/")
      ),
    ]
  },

  /**
   * /omnis/* 는 Omnis 로 넘긴다. 사이트·관리 화면·사진 경로가 전부 같은 도메인의
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

    return {
      beforeFiles: [
        { source: "/omnis", destination: omnis },
        { source: "/omnis/:path*", destination: `${omnis}/:path*` },
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

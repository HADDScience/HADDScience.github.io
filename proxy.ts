import { NextResponse, type NextRequest } from "next/server"

import { AVAILABLE_LANGS, DEFAULT_LANG } from "@/content"
import { SITE_URL } from "@/lib/site-env"

/**
 * 공개 페이지를 대표 주소(`SITE_URL`)로 영구 이전할 호스트.
 *
 * `haddscience.vercel.app` 이 haddscience.com 과 같은 내용을 그대로 서브해 두 주소가 검색
 * 결과에서 경쟁했다. canonical 이 대표 주소를 가리키긴 하지만 주소 자체가 살아 있으면 링크가
 * 그쪽으로도 쌓인다. 그래서 **페이지만** 308 로 넘긴다(2026-09-28).
 *
 * 도메인 설정에서 호스트 통째로 넘기면 안 된다 — 이 호스트는 공개 사이트 말고도 쓰인다:
 *   · `/admin` — Omnis SSO 에 앱 오리진이 `https://haddscience.vercel.app` 로 등록돼 있다
 *     (`website-admin-vercel`). 넘기면 로그인 후 돌아올 곳이 사라진다.
 *   · `/hub` · `/omnis` — 다른 프로젝트로 가는 rewrite. Omnis SSO 인가 주소도 여기 있다.
 *   · `/omnis/api/ip-mcp` — HADD IP MCP 엔드포인트. MCP 클라이언트는 리다이렉트를 따르지 않는다.
 * 이 경로들은 아래 `config.matcher` 가 이미 빼고 있어 이 함수에 들어오지 않는다.
 *
 * 미리보기 주소(`haddscience-<해시>-….vercel.app`)는 이름이 달라 걸리지 않는다 — 넘기면
 * 프리뷰를 볼 수 없다.
 */
const LEGACY_PUBLIC_HOSTS = new Set(["haddscience.vercel.app"])

/**
 * 언어 접두사가 없는 요청을 로케일 경로로 보낸다. 서버 렌더로 바뀌면서(2026-09-07)
 * 배포에서도 실제로 동작한다 — 예전 정적 export 시절에는 dev 전용이었다.
 * `/about` → `/ko/about`. Accept-Language 에 영어가 우선이면 `/en/...`.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // 경로를 그대로 둔 채 호스트만 바꾼다. 언어 고르기는 대표 주소가 한 번 더 한다 — 영구
  // 리다이렉트(308)는 브라우저가 기억하므로, 방문자마다 다른 곳(/ko · /en)을 가리키면 안 된다.
  const host = request.headers.get("host")
  if (host && LEGACY_PUBLIC_HOSTS.has(host)) {
    return NextResponse.redirect(new URL(pathname + search, SITE_URL), 308)
  }

  const hasLocale = AVAILABLE_LANGS.some(
    (lang) => pathname === `/${lang}` || pathname.startsWith(`/${lang}/`)
  )
  if (hasLocale) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = `/${preferredLang(request)}${pathname === "/" ? "" : pathname}`
  return NextResponse.redirect(url)
}

function preferredLang(request: NextRequest) {
  const header = request.headers.get("accept-language") ?? ""
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=")
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of ranked) {
    const match = AVAILABLE_LANGS.find((lang) => tag.startsWith(lang))
    if (match) return match
  }
  return DEFAULT_LANG
}

export const config = {
  // _next 내부 자산, public 파일, 파일 확장자가 있는 요청은 건드리지 않는다.
  // 언어 라우팅 밖에 있는 것도 제외한다: /admin(관리 화면) · /api(재검증) ·
  // /omnis(Omnis 로 rewrite) · /hub(허브 프로젝트로 rewrite) · /.well-known(MCP 디스커버리).
  matcher: ["/((?!_next|admin|api|omnis|hub|\\.well-known|.*\\..*).*)"],
}

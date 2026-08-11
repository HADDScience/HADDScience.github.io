import { NextResponse, type NextRequest } from "next/server"

import { AVAILABLE_LANGS, DEFAULT_LANG } from "@/content"

/**
 * 언어 접두사가 없는 요청을 로케일 경로로 보낸다.
 * `/about` → `/ko/about`. Accept-Language 에 영어가 우선이면 `/en/...`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

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
  matcher: ["/((?!_next|.*\\..*).*)"],
}

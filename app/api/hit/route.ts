import { createHmac } from "node:crypto"

import { NextRequest, NextResponse } from "next/server"

import { SITE_URL } from "@/lib/site-env"

/**
 * 방문 한 건을 받아 Omnis 로 넘긴다. 공개 페이지의 비콘(`components/visit-beacon.tsx`)이 부른다.
 *
 * 브라우저가 Omnis 를 직접 부르지 않는 이유는 둘이다 — 공유 비밀을 브라우저에 둘 수 없고,
 * 주소가 공개되면 봇이 사이트를 거치지 않고 숫자를 부풀린다.
 *
 * **여기서 IP 와 UA 를 쓰고 버린다.** 방문자 구분용 해시를 만드는 데만 쓰고 Omnis 로는
 * 보내지 않는다. 해시 키에 그날 날짜(KST)가 들어가므로 날이 바뀌면 같은 사람도 다른 값이
 * 되고, 어제와 오늘을 이어 붙일 수 없다. 쿠키를 쓰지 않으니 동의 배너도 필요 없다.
 *
 * 계약의 정본은 Omnis 의 `mydocs/plans/2026-09-22-website-visit-stats.md`.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const OMNIS_ORIGIN =
  process.env.NEXT_PUBLIC_OMNIS_URL ?? "https://omnis.haddscience.com"

/** 사람이 아닌 것. 비콘은 자바스크립트가 돌아야 오므로 대부분의 크롤러는 애초에 오지 않는다. */
const BOT =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora link preview|monitor|curl|wget|python-requests|headless|lighthouse|pingdom|gtmetrix|semrush|ahrefs/i

const MOBILE = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i

/** 그날(KST) 날짜. 해시 키에 들어가 하루가 지나면 같은 사람도 다른 값이 된다. */
function kstToday(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** 우리 도메인에서 넘어온 것은 유입이 아니라 내부 이동이다. */
function referrerHost(referrer: string | undefined): string | null {
  if (!referrer) return null
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "")
    const self = new URL(SITE_URL).hostname.replace(/^www\./, "")
    return host === self ? null : host.slice(0, 128)
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  // 무엇을 걸렀는지는 알려 주지 않는다. 비콘은 응답을 읽지도 않는다.
  const done = new NextResponse(null, { status: 204 })

  const secret = process.env.WEBSITE_VISIT_SECRET
  if (!secret) return done

  // 다른 페이지에 심어 놓고 우리 숫자를 부풀리지 못하게 한다. 같은 출처 요청에는 Origin 이
  // 붙고, 없는 경우(옛 브라우저)는 통과시킨다 — 여기서 막을 것은 남의 페이지다.
  const origin = req.headers.get("origin")
  if (origin && origin !== SITE_URL) return done

  // 프리페치는 사람이 본 것이 아니다.
  const purpose =
    req.headers.get("sec-purpose") ?? req.headers.get("purpose") ?? ""
  if (purpose.includes("prefetch")) return done

  const ua = req.headers.get("user-agent") ?? ""
  if (!ua || BOT.test(ua)) return done

  const body = (await req.json().catch(() => null)) as {
    path?: unknown
    referrer?: unknown
  } | null
  const rawPath = typeof body?.path === "string" ? body.path : ""
  // 질의문자·해시는 통계에 쓸모가 없고 개인을 가리키는 값이 붙어 오는 경우가 있다.
  const path = rawPath.split(/[?#]/)[0].slice(0, 512)
  if (!path.startsWith("/")) return done

  const lang = path.startsWith("/en")
    ? "en"
    : path.startsWith("/ko")
      ? "ko"
      : null
  if (!lang) return done // 공개 페이지는 전부 /ko · /en 아래다. 관리 화면은 세지 않는다

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    ""

  const visitorHash = createHmac("sha256", secret)
    .update(`${kstToday()}|${ip}|${ua}`)
    .digest("hex")
    .slice(0, 32)

  try {
    await fetch(`${OMNIS_ORIGIN}/api/website/visits`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        path,
        lang,
        visitorHash,
        referrerHost: referrerHost(
          typeof body?.referrer === "string" ? body.referrer : undefined
        ),
        device: MOBILE.test(ua) ? "mobile" : "desktop",
      }),
      cache: "no-store",
    })
  } catch {
    // 통계 한 건보다 방문자의 화면이 먼저다. 조용히 버린다.
  }
  return done
}

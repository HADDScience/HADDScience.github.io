import { NextRequest, NextResponse } from "next/server"

import { OMNIS_API_BASE } from "@/lib/site-env"

/**
 * 문의 폼 접수. 브라우저 → 여기 → Omnis `POST /api/website/inquiries`.
 *
 * 브라우저를 Omnis 에 직접 붙이지 않는다. 그러면 그 엔드포인트가 공개돼 봇이 이 사이트를
 * 건너뛰고 바로 때린다. 여기서 한 번 받아 공유 비밀을 붙여 넘기면 Omnis 는 이 사이트가
 * 보낸 것만 받는다. 비밀을 나누는 방식은 `app/api/revalidate` 와 같다.
 *
 * Omnis 에서도 문의는 CRM 이 아니라 문의함(`WebsiteInquiry`)에 쌓인다 — 이 폼은 아무나
 * 쓸 수 있으므로 사람이 승인해야 기관·담당자·견적이 된다.
 *
 * 계약의 정본은 Omnis `mydocs/plans/2026-09-22-website-inquiry-to-crm.md`.
 * 사이트 쪽 결정은 `mydocs/plans/2026-09-22-contact-to-omnis-inquiry.md`.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** `content/ko.ts` 의 `contact.form.topicOptions` 와 같은 값. Omnis 도 이 다섯만 받는다. */
const TOPICS = ["sample", "pricing", "technical", "partnership", "etc"] as const

const LANGS = ["ko", "en"] as const

const MAX = {
  name: 100,
  organization: 200,
  email: 200,
  phone: 50,
  message: 5000,
} as const

/**
 * 폼이 그려진 뒤 이만큼은 지나야 사람으로 본다. 사람이 이름·이메일·문의 내용을 읽고
 * 채우는 데 3초보다 오래 걸린다.
 */
const MIN_ELAPSED_MS = 3000

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 폼이 필드별 오류 문구를 고르는 열쇠. 한국어·영어 문구는 `content/*.ts` 에 있다. */
type Issue = "required" | "invalidEmail" | "tooLong"

type Field = "name" | "organization" | "email" | "phone" | "message" | "consent"

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null)
  if (body === null || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_inquiry" }, { status: 400 })
  }
  const raw = body as Record<string, unknown>
  const str = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "")

  /**
   * 봇 거르기. 걸리면 **접수된 척 201 을 준다.**
   * 실패를 알려 주면 봇이 맞을 때까지 고쳐 온다. 사람에게는 이 두 조건이 걸리지 않는다 —
   * 허니팟은 화면·자동완성·스크린리더 밖에 있고, 3초는 폼을 채우는 시간보다 짧다.
   */
  const elapsed = typeof raw.elapsedMs === "number" ? raw.elapsedMs : 0
  if (str("company") !== "" || elapsed < MIN_ELAPSED_MS) {
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  const fields: Partial<Record<Field, Issue>> = {}
  const check = (field: keyof typeof MAX, value: string, required: boolean) => {
    if (required && value === "") fields[field] = "required"
    else if (value.length > MAX[field]) fields[field] = "tooLong"
  }
  check("name", str("name"), true)
  check("email", str("email"), true)
  check("message", str("message"), true)
  check("organization", str("organization"), false)
  check("phone", str("phone"), false)
  if (!fields.email && !EMAIL.test(str("email"))) fields.email = "invalidEmail"
  if (raw.consent !== true) fields.consent = "required"

  const topic = TOPICS.includes(str("topic") as (typeof TOPICS)[number])
    ? (str("topic") as (typeof TOPICS)[number])
    : null
  const lang = LANGS.includes(str("lang") as (typeof LANGS)[number])
    ? (str("lang") as (typeof LANGS)[number])
    : "ko"

  // topic 은 사이트의 select 가 값을 묶으므로 폼에서 틀릴 수 없다. 틀렸다면 코드 문제다 —
  // 필드 오류가 아니라 일반 실패로 보내, 방문자가 메일 되돌림을 보게 한다.
  if (Object.keys(fields).length > 0) {
    return NextResponse.json({ error: "invalid_inquiry", fields }, { status: 400 })
  }
  if (topic === null) {
    return NextResponse.json({ error: "invalid_inquiry" }, { status: 400 })
  }

  // 비밀이 없으면 아무것도 보내지 않는다. 폼은 이 503 을 보고 메일 되돌림을 띄운다 —
  // 환경변수를 빠뜨린 배포에서 문의가 조용히 사라지는 것보다 낫다.
  const secret = process.env.INQUIRY_SECRET
  if (!secret) {
    console.error("[contact] INQUIRY_SECRET 이 없다. 문의를 Omnis 로 보내지 않았다.")
    return NextResponse.json({ error: "unavailable" }, { status: 503 })
  }

  let res: Response
  try {
    res = await fetch(`${OMNIS_API_BASE}/inquiries`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: str("name"),
        organization: str("organization"),
        email: str("email"),
        phone: str("phone"),
        topic,
        message: str("message"),
        lang,
        ip: clientIp(req),
        userAgent: req.headers.get("user-agent") ?? undefined,
      }),
      cache: "no-store",
    })
  } catch (err) {
    console.error("[contact] Omnis 에 닿지 못했다:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "unavailable" }, { status: 503 })
  }

  // 200 은 5분 안의 같은 문의(중복 접수). 방문자에게는 201 과 같은 일이다.
  if (res.ok) return NextResponse.json({ ok: true }, { status: 201 })

  if (res.status === 429) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }
  // 400 이 여기까지 왔다면 위 검사와 Omnis 의 검사가 어긋난 것이다. 방문자 탓이 아니므로
  // 필드 오류로 되돌리지 않고 일반 실패로 보낸다.
  console.error(`[contact] Omnis 가 거부했다: HTTP ${res.status} ${await res.text().catch(() => "")}`)
  return NextResponse.json({ error: "unavailable" }, { status: 503 })
}

/**
 * 방문자 IP. Omnis 는 서버 간 호출을 받으므로 직접 볼 수 없고, 레이트리밋에 이 값을 쓴다.
 * Vercel 은 `x-forwarded-for` 에 프록시를 거친 순서대로 넣는다 — 맨 앞이 방문자다.
 */
function clientIp(req: NextRequest): string | undefined {
  const first = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return first || req.headers.get("x-real-ip") || undefined
}

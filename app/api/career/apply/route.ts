import { NextRequest, NextResponse } from "next/server"

import { en } from "@/content/en"
import { ko } from "@/content/ko"
import {
  validateApplication,
  type ApplicationPayload,
  type FileMeta,
} from "@/lib/career-application"

/**
 * 지원서 접수 — **골격만 있다** (2026-11-24).
 *
 * 문의 폼(`app/api/contact`)은 Omnis 문의함 `POST /api/website/inquiries` 로 보내지만, 그쪽은
 * 주제 다섯 가지(sample · pricing …)와 본문 5000자만 받고 파일을 받지 않는다. 지원서는 칸도 다르고
 * 이력서 파일이 따라와야 해서 같은 경로에 실을 수 없다. 받을 곳이 정해질 때까지 이 라우트는
 * 검사까지만 하고 503 을 돌려준다 — 폼은 503 을 보고 작성한 내용을 담은 메일 되돌림을 띄운다.
 * 지원서가 조용히 사라지는 일은 없다.
 *
 * 받을 곳을 정하면 `deliver()` 만 바꾸면 된다. 선택지는 작업 보고서
 * (`~/work/omnis-reports/hadd-career-261124.md`)에 적었다.
 *
 * 파일은 이 라우트로 오지 않는다. Vercel Function 본문 한도(4.5MB)보다 이력서 상한(10MB)이 크다.
 * 저장소가 정해지면 브라우저가 저장소에 직접 올리고, 여기에는 올라간 파일의 메타데이터만 온다.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** 문의 폼과 같은 값. 사람이 이 폼을 3초 안에 채울 수는 없다. */
const MIN_ELAPSED_MS = 3000

/** 지원을 받는 공고. 언어와 상관없이 slug 가 같다. */
const OPEN_JOBS = new Set(
  [...ko.career.jobs, ...en.career.jobs].filter((j) => j.status === "open").map((j) => j.slug)
)

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null)
  if (body === null || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_application" }, { status: 400 })
  }
  const raw = body as Record<string, unknown>
  const str = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "")

  // 봇 거르기 — 문의 폼과 같다. 걸리면 접수된 척 201 을 준다(실패를 알려 주면 봇이 고쳐 온다).
  const elapsed = typeof raw.elapsedMs === "number" ? raw.elapsedMs : 0
  if (str("company") !== "" || elapsed < MIN_ELAPSED_MS) {
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  const payload: ApplicationPayload = {
    job: str("job"),
    name: str("name"),
    department: str("department"),
    studentId: str("studentId"),
    grade: str("grade"),
    graduation: str("graduation"),
    phone: str("phone"),
    email: str("email"),
    resume: fileMeta(raw.resume),
    portfolioFile: fileMeta(raw.portfolioFile),
    portfolioUrl: str("portfolioUrl"),
    motivation: str("motivation"),
    consent: raw.consent === true,
  }

  // 공고는 페이지가 정해 보내므로 방문자가 틀릴 수 없다. 틀렸다면 마감됐거나 코드 문제다.
  if (!OPEN_JOBS.has(payload.job)) {
    return NextResponse.json({ error: "job_closed" }, { status: 400 })
  }

  const fields = validateApplication(payload)
  if (Object.keys(fields).length > 0) {
    return NextResponse.json({ error: "invalid_application", fields }, { status: 400 })
  }

  const lang = str("lang") === "en" ? "en" : "ko"
  const delivered = await deliver(payload, lang)
  if (!delivered) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}

/**
 * 지원서를 받을 곳으로 넘긴다. 아직 정해지지 않았다.
 *
 * 개인정보(이름 · 학번 · 연락처)를 로그에 남기지 않는다 — 받을 곳이 없다는 사실만 남긴다.
 */
async function deliver(payload: ApplicationPayload, lang: "ko" | "en"): Promise<boolean> {
  void payload
  void lang
  console.error("[career] 지원서를 받을 곳이 정해지지 않았다. 폼이 메일 되돌림을 띄운다.")
  return false
}

function fileMeta(value: unknown): FileMeta | null {
  if (value === null || typeof value !== "object") return null
  const v = value as Record<string, unknown>
  if (typeof v.name !== "string" || typeof v.size !== "number") return null
  return {
    name: v.name.slice(0, 255),
    size: v.size,
    type: typeof v.type === "string" ? v.type : "",
  }
}

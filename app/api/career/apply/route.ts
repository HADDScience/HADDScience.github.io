import { NextRequest, NextResponse } from "next/server"

import { en } from "@/content/en"
import { ko } from "@/content/ko"
import {
  validateApplication,
  type ApplicationPayload,
  type FileMeta,
} from "@/lib/career-application"
import { isClosed } from "@/lib/career-deadline"

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
 * 마감(공고의 `closesAt`, 2026-11-27 17:00 KST)이 지나면 410 `closed` 를 준다. 서버 시계로 판단하므로
 * 방문자 브라우저의 시계가 틀려도 마감 뒤 지원서는 받지 않는다. 폼은 410 을 보면 메일 되돌림 없이
 * 「모집이 끝났습니다」만 보여 준다. 마감 판단은 봇 거르기보다 먼저 한다 — 마감 뒤에는 사람에게도
 * 접수된 척 201 을 주면 안 되기 때문이다.
 *
 * 파일은 이 라우트로 오지 않는다. Vercel Function 본문 한도(4.5MB)보다 이력서 상한(10MB)이 크다.
 * 저장소가 정해지면 브라우저가 저장소에 직접 올리고, 여기에는 올라간 파일의 메타데이터만 온다.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** 문의 폼과 같은 값. 사람이 이 폼을 3초 안에 채울 수는 없다. */
const MIN_ELAPSED_MS = 3000

/** 공고. 언어와 상관없이 slug · 마감 · tracks 의 value 가 같으므로 한국어 쪽을 기준으로 본다. */
const JOBS = new Map(ko.career.jobs.map((j) => [j.slug, j]))
// 영어 쪽에만 있는 공고가 생기면 조용히 404 가 되지 않게 함께 넣는다.
for (const j of en.career.jobs) if (!JOBS.has(j.slug)) JOBS.set(j.slug, j)

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null)
  if (body === null || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_application" }, { status: 400 })
  }
  const raw = body as Record<string, unknown>
  const str = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "")

  // 공고는 페이지가 정해 보내므로 방문자가 틀릴 수 없다. 틀렸다면 코드 문제다.
  const job = JOBS.get(str("job"))
  if (!job) {
    return NextResponse.json({ error: "unknown_job" }, { status: 400 })
  }
  if (isClosed(job, Date.now())) {
    return NextResponse.json({ error: "closed" }, { status: 410 })
  }

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
    // 공고에 없는 값은 버린다. 선택 사항이므로 오류로 돌려보내지 않는다.
    interests: Array.isArray(raw.interests)
      ? [...new Set(raw.interests.filter((v): v is string => typeof v === "string"))].filter((v) =>
          job.tracks.some((t) => t.value === v)
        )
      : [],
    motivation: str("motivation"),
    consent: raw.consent === true,
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

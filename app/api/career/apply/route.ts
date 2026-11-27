import { NextRequest, NextResponse } from "next/server"

import { en } from "@/content/en"
import { ko } from "@/content/ko"
import {
  validateApplication,
  type ApplicationPayload,
  type FileMeta,
} from "@/lib/career-application"
import { isClosed } from "@/lib/career-deadline"
import { INVITE_SECRET_ENV, markMotivation, verifyInvite } from "@/lib/career-invite"
import type { UploadTicket } from "@/lib/career-upload"
import { omnisFetch } from "@/lib/omnis-fetch"
import { OMNIS_API_BASE } from "@/lib/site-env"

/**
 * 지원서 접수 ① — 검사하고 옴니스 지원서함에 지원서를 연다(2026-11-24).
 *
 * 흐름(계약 정본: `~/work/omnis-reports/omnis-hr-api-contract-261124.md`)
 *   ① 브라우저 → 여기: 칸 검사 · 마감 · 봇 거르기
 *   ② 여기 → 옴니스 `POST /api/website/applications`(비밀 `CAREER_SECRET`): 지원서를 열고 파일 티켓을 받는다
 *   ③ 브라우저 → 옴니스: 티켓으로 이력서 · 포트폴리오를 조각(4MB)으로 PUT — 파일은 이 서버를 거치지 않는다
 *   ④ 브라우저 → `/api/career/apply/complete` → ⑤ 옴니스 접수 확정 → 접수 번호
 *
 * 옴니스가 실패하거나 `CAREER_SECRET` 이 없으면 503 을 준다. 폼은 503 을 보고 작성한 내용을 담은
 * 메일 되돌림(info@)을 띄운다 — 지원서가 조용히 사라지지 않는다. 문의 폼(`app/api/contact`)과 같은 불변식이다.
 * 비밀은 문의함 비밀(`INQUIRY_SECRET`)과 다른 값이다. 프리뷰에는 넣지 않는다 — 프리뷰가 운영 옴니스를
 * 부르면 운영 DB 에 지원서가 생긴다.
 *
 * 마감(공고의 `closesAt`, 2026-11-27 17:00 KST)이 지나면 410 `closed` 를 준다. 서버 시계로 판단하므로
 * 방문자 브라우저의 시계가 틀려도 마감 뒤 지원서는 받지 않는다. 폼은 410 을 보면 메일 되돌림 없이
 * 「모집이 끝났습니다」만 보여 준다. 마감 판단은 봇 거르기보다 먼저 한다 — 마감 뒤에는 사람에게도
 * 접수된 척 201 을 주면 안 되기 때문이다.
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
  // 마감 뒤에는 개인 초대 토큰(lib/career-invite.ts)이 이 공고 · 아직 유효할 때만 받는다. 만료 · 서명 틀림 · 다른 공고면 지금처럼 마감
  const invite = isClosed(job, Date.now())
    ? verifyInvite(raw.invite, job.slug, Date.now(), process.env[INVITE_SECRET_ENV])
    : null
  if (invite && !invite.ok) {
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
  const lateInvite = invite?.ok ? invite.tag : null

  const fields = validateApplication(payload)
  if (Object.keys(fields).length > 0) {
    return NextResponse.json({ error: "invalid_application", fields }, { status: 400 })
  }

  const lang = str("lang") === "en" ? "en" : "ko"
  const content = lang === "en" ? en : ko
  const opened = await deliver(lateInvite ? { ...payload, motivation: markMotivation(payload.motivation, 1500) } : payload, {
    lang,
    jobTitle: (content.career.jobs.find((j) => j.slug === job.slug) ?? job).title,
    consentVersion: content.career.form.consentVersion,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
    invite: lateInvite,
  })
  if (!opened) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 })
  }
  return NextResponse.json({ ok: true, ...opened }, { status: 201 })
}

/** 옴니스가 지원서를 열고 돌려주는 것. 브라우저에 그대로 넘긴다(계약 2절). */
export interface OpenedApplication {
  id: string
  duplicate: boolean
  /** 이미 접수된 지원서(5분 안에 다시 낸 경우)면 접수 번호가 오고 uploads 는 비어 있다. */
  code?: string
  uploads: UploadTicket[]
}


/**
 * 옴니스 지원서함에 지원서를 연다(②). 실패하면 null — 호출자가 503 을 주고 폼이 메일 되돌림을 띄운다.
 *
 * 개인정보(이름 · 학번 · 연락처)를 로그에 남기지 않는다. 상태 코드와 오류 이름만 남긴다.
 * `omnisFetch` 는 10초 · 재시도 1회다. 재시도가 지원서를 둘로 만들지 않는 것은 옴니스가 5분 안의 같은
 * 이메일 · 공고를 `200 duplicate` 로 받기 때문이다(계약 2절).
 */
async function deliver(
  payload: ApplicationPayload,
  meta: { lang: "ko" | "en"; jobTitle: string; consentVersion: string; ip?: string; userAgent?: string; invite?: string | null }
): Promise<OpenedApplication | null> {
  const secret = process.env.CAREER_SECRET
  if (!secret) {
    console.error("[career] CAREER_SECRET 이 없다. 지원서를 옴니스로 보내지 않았다(메일 되돌림).")
    return null
  }

  let res: Response
  try {
    res = await omnisFetch(`${OMNIS_API_BASE}/applications`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        job: payload.job,
        jobTitle: meta.jobTitle,
        lang: meta.lang,
        name: payload.name,
        department: payload.department,
        studentId: payload.studentId,
        grade: payload.grade,
        graduation: payload.graduation,
        phone: payload.phone,
        email: payload.email,
        portfolioUrl: payload.portfolioUrl,
        // 계약(2026-11-24)에 아직 없는 칸이다. 옴니스가 받기 시작하면 그대로 저장된다 — 지금은 버려진다.
        interests: payload.interests,
        motivation: payload.motivation,
        consent: payload.consent,
        consentVersion: meta.consentVersion,
        resume: payload.resume,
        portfolioFile: payload.portfolioFile,
        ip: meta.ip,
        userAgent: meta.userAgent,
        // 마감 뒤 초대로 받은 추가 접수 — 옴니스 계약에 아직 없는 칸이라 지금은 버려진다. 그래서 지원 동기 앞에도 표시를 붙였다
        ...(meta.invite ? { lateInvite: meta.invite } : {}),
      }),
      cache: "no-store",
    })
  } catch (err) {
    console.error("[career] 옴니스에 닿지 못했다:", err instanceof Error ? err.message : err)
    return null
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string; issues?: unknown } | null
    // 400 이면 홈페이지와 옴니스의 검사 규칙이 어긋난 것이고, 401 이면 비밀이 틀린 것이다 — 둘 다 설정 · 코드 문제다.
    // 옴니스의 issues 는 「칸: 규칙」(예: "portfolioFile.size: 10MB 이하")이라 지원자가 쓴 값이 들어 있지 않다.
    // 어느 칸이 어긋났는지 알아야 고칠 수 있어 함께 남긴다(2026-11-24 운영 실패 때 이것이 없어 원인을 좁히지 못했다).
    const issues = Array.isArray(body?.issues)
      ? body.issues.filter((i): i is string => typeof i === "string").slice(0, 10).join(" ; ")
      : ""
    console.error(
      `[career] 옴니스가 지원서를 받지 않았다: HTTP ${res.status} ${body?.error ?? ""}${issues ? ` — ${issues}` : ""}`
    )
    return null
  }

  const body = (await res.json().catch(() => null)) as Partial<OpenedApplication> | null
  if (!body || typeof body.id !== "string" || !Array.isArray(body.uploads)) {
    console.error("[career] 옴니스 응답 모양이 계약과 다르다.")
    return null
  }
  return {
    id: body.id,
    duplicate: body.duplicate === true,
    code: typeof body.code === "string" ? body.code : undefined,
    uploads: body.uploads,
  }
}

/** 방문자 IP — 문의 폼(`app/api/contact`)과 같다. 옴니스가 시도 제한에만 쓰고 파기 때 지운다. */
function clientIp(req: NextRequest): string | undefined {
  const first = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return first || req.headers.get("x-real-ip") || undefined
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

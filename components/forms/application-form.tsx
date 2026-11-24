"use client"

import * as React from "react"

import { useHoldOpen } from "@/components/ds/job-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Lang } from "@/content"
import type { JobPosting, SiteContent } from "@/content/types"
import {
  APPLICATION_MAX,
  validateApplication,
  type ApplicationField,
  type ApplicationIssue,
  type ApplicationPayload,
  type FileMeta,
} from "@/lib/career-application"
import { isClosedNow } from "@/lib/career-deadline"
import { uploadFile, type UploadTicket } from "@/lib/career-upload"
import { formatPhone } from "@/lib/phone"
import { cn } from "@/lib/utils"

type Errors = Partial<Record<ApplicationField, string>>
type Form = SiteContent["career"]["form"]

/** 화면에 놓인 순서. 각 값은 그 칸의 id 다. */
const FIELD_ORDER: ApplicationField[] = [
  "name",
  "department",
  "studentId",
  "grade",
  "graduation",
  "phone",
  "email",
  "resume",
  "portfolioFile",
  "portfolioUrl",
  "motivation",
  "consent",
]

const SELECT_CLASS =
  "h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-base transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"

/**
 * ApplicationForm — 상세 페이지가 카드 안에 놓으므로 완료·실패 화면은 카드를 다시 두르지 않는다.
 *
 * ApplicationForm — 옴니스 지원서함으로 보낸다(계약 `omnis-hr-api-contract-261124.md`).
 *   ① `POST /api/career/apply` → 지원서 id 와 파일 티켓
 *   ③ 티켓으로 이력서 · 포트폴리오를 옴니스에 조각 PUT(진행 막대) — `lib/career-upload.ts`
 *   ④ `POST /api/career/apply/complete` → 접수 번호
 *
 * 문의 폼(`contact-form.tsx`)과 같은 불변식을 지킨다: 어느 단계에서 실패해도 작성한 내용을 담은
 * `mailto:` 로 되돌려 지원서를 잃지 않는다. 옴니스 연결이 꺼져 있으면(`CAREER_SECRET` 없음) ① 이 503 을
 * 주므로 처음부터 이 되돌림이 접수 경로다. 메일에는 파일을 붙일 수 없으니 첨부해 달라고 적는다.
 *
 * 마감(2026-11-27 17:00 KST) 뒤에는 접수하지 않는다. 상세 페이지가 마감 시각에 폼을 통째로 내리지만
 * (`WhenOpen`), 제출 순간에 한 번 더 보고 API 가 410 을 주면 그것도 따른다. 마감 뒤에는 메일 되돌림을
 * 띄우지 않는다 — 되돌림이 열리면 마감 뒤 지원이 메일로 들어온다.
 *
 * 봇 거르기도 문의 폼과 같다 — 허니팟 칸 `company` 와 폼을 만난 뒤 지난 시간 `elapsedMs`.
 */
export function ApplicationForm({
  form: t,
  email,
  lang,
  job,
  closedNotice,
}: {
  form: Form
  /** 메일 되돌림을 받을 주소. */
  email: string
  /** 「모집이 끝났습니다」 */
  closedNotice: string
  lang: Lang
  job: JobPosting
}) {
  const [errors, setErrors] = React.useState<Errors>({})
  const [status, setStatus] = React.useState<
    "idle" | "sending" | "uploading" | "sent" | "failed" | "closed"
  >("idle")
  /** 올린 바이트 / 전체 바이트. 진행 막대에 쓴다. */
  const [progress, setProgress] = React.useState({ sent: 0, total: 0 })
  /** 옴니스가 준 접수 번호. 완료 화면에 보인다. */
  const [code, setCode] = React.useState<string | null>(null)
  /** 제출을 시작하면 마감 시각이 지나도 폼을 내리지 않게 붙잡는다(`WhenOpen`). */
  const holdOpen = useHoldOpen()
  const [failBody, setFailBody] = React.useState(t.failBody)
  const [mailtoHref, setMailtoHref] = React.useState("")
  const [motivationLength, setMotivationLength] = React.useState(0)

  const startedAt = React.useRef<number | null>(null)
  const markStart = React.useCallback(() => {
    startedAt.current ??= Date.now()
  }, [])
  React.useEffect(markStart, [markStart])

  const messageOf = (issue: ApplicationIssue): string => t[issue]

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === "sending") return
    if (isClosedNow(job)) {
      setStatus("closed")
      return
    }

    const data = new FormData(event.currentTarget)
    const value = (key: string) => String(data.get(key) ?? "").trim()
    const file = (key: string): FileMeta | null => {
      const f = data.get(key)
      // 파일을 고르지 않으면 브라우저가 이름 없는 빈 File 을 넣는다.
      if (!(f instanceof File) || f.name === "") return null
      return { name: f.name, size: f.size, type: f.type }
    }

    const payload: ApplicationPayload = {
      job: job.slug,
      name: value("name"),
      department: value("department"),
      studentId: value("studentId"),
      grade: value("grade"),
      graduation: value("graduation"),
      phone: value("phone"),
      email: value("email"),
      resume: file("resume"),
      portfolioFile: file("portfolioFile"),
      portfolioUrl: value("portfolioUrl"),
      interests: data.getAll("interests").map(String),
      motivation: value("motivation"),
      consent: data.get("consent") !== null,
    }

    const issues = validateApplication(payload)
    const next: Errors = Object.fromEntries(
      Object.entries(issues).map(([field, issue]) => [field, messageOf(issue)])
    )
    setErrors(next)
    if (Object.keys(next).length > 0) {
      // 첫 오류 칸으로 옮긴다. 모바일에서는 오류가 화면 밖에 있기 쉽다. aria-invalid 는 다음
      // 렌더에야 붙으므로 그것으로 찾지 않고 칸 순서로 고른다.
      const first = FIELD_ORDER.find((f) => f in next)
      if (first) document.getElementById(first)?.focus()
      return
    }

    setMailtoHref(buildMailto(email, job, t, payload))
    setStatus("sending")
    holdOpen(true)

    // 실제 파일. payload 에는 이름 · 크기만 들어가고, 바이트는 ③ 에서 옴니스로 바로 간다.
    const files: Record<UploadTicket["slot"], File | null> = {
      resume: fileOf(data, "resume"),
      portfolio: fileOf(data, "portfolioFile"),
    }
    const open = () =>
      fetch("/api/career/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          lang,
          company: value("company"),
          elapsedMs: elapsedSince(startedAt.current),
        }),
      })

    try {
      let res = await open()

      if (res.ok) {
        let opened = (await res.json().catch(() => null)) as Opened | null
        // 봇 거르기에 걸린 요청은 id 없이 201 을 받는다. 사람에게는 일어나지 않는다.
        if (!opened?.id) return finish(null)
        // 5분 안에 같은 지원서를 이미 접수했다(두 번 누르기 · 재시도).
        if (opened.code && opened.uploads.length === 0) return finish(opened.code)

        setStatus("uploading")
        let reopened = false
        upload: for (;;) {
          const total = opened.uploads.reduce((n, u) => n + u.size, 0)
          let done = 0
          setProgress({ sent: 0, total })
          for (const ticket of opened.uploads) {
            const file = files[ticket.slot]
            if (!file) return fail()
            const result = await uploadFile(ticket, file, (sent) => setProgress({ sent: done + sent, total }))
            if (result === "not_receiving") break
            if (result === "not_pdf") {
              const field = ticket.slot === "resume" ? "resume" : "portfolioFile"
              setErrors({ [field]: t.notPdf })
              holdOpen(false)
              setStatus("idle")
              return
            }
            if (result === "bad_ticket" && !reopened) {
              // 티켓이 만료됐다(30분). 지원서를 다시 열면 5분 안이면 같은 지원서에 새 티켓이 온다.
              reopened = true
              res = await open()
              const again = res.ok ? ((await res.json().catch(() => null)) as Opened | null) : null
              if (!again?.id) return fail()
              if (again.code && again.uploads.length === 0) return finish(again.code)
              opened = again
              continue upload
            }
            if (result !== "ok") return fail()
            done += ticket.size
          }
          break
        }

        const complete = await fetch("/api/career/apply/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: opened.id }),
        })
        const result = (await complete.json().catch(() => null)) as { code?: string } | null
        if (complete.ok && result?.code) return finish(result.code)
        return fail()
      }
      if (res.status === 410) {
        setStatus("closed")
        return
      }
      if (res.status === 429) {
        if (isClosedNow(job)) return setStatus("closed")
        setFailBody(t.rateLimited)
        setStatus("failed")
        return
      }
      if (res.status === 400) {
        const body = (await res.json().catch(() => null)) as {
          fields?: Partial<Record<ApplicationField, ApplicationIssue>>
        } | null
        const fields = body?.fields
        if (fields && Object.keys(fields).length > 0) {
          setErrors(
            Object.fromEntries(
              Object.entries(fields).map(([field, issue]) => [field, messageOf(issue)])
            )
          )
          holdOpen(false)
          setStatus("idle")
          return
        }
      }
      fail()
    } catch {
      fail()
    }
  }

  /** 접수 완료. 접수 번호가 있으면 보여 준다. */
  const finish = (received: string | null) => {
    setCode(received)
    setStatus("sent")
  }

  /** 메일 되돌림을 띄운다. 그새 마감이 지났으면 띄우지 않는다. */
  const fail = () => {
    if (isClosedNow(job)) {
      setStatus("closed")
      return
    }
    setFailBody(t.failBody)
    setStatus("failed")
  }

  const reset = () => {
    setErrors({})
    setFailBody(t.failBody)
    setMailtoHref("")
    setMotivationLength(0)
    startedAt.current = Date.now()
    setProgress({ sent: 0, total: 0 })
    setCode(null)
    holdOpen(false)
    setStatus("idle")
  }

  if (status === "closed") {
    return (
      <p className="text-xl font-bold break-keep" role="alert">
        {closedNotice}
      </p>
    )
  }

  if (status === "sent") {
    return (
      <div className="grid gap-3" role="status">
        <p className="text-xl font-bold break-keep">{t.successTitle}</p>
        {code ? (
          <p className="font-semibold">
            {t.receiptLabel} <span className="font-mono text-primary">{code}</span>
          </p>
        ) : null}
        {/* 접수 확인 메일은 옴니스가 접수 확정 때 보낸다 — 접수 번호가 있는(옴니스로 접수된) 경우에만 알린다. */}
        {code ? <p className="text-sm text-muted-foreground">{t.receiptMail}</p> : null}
        <p className="text-muted-foreground">{t.successBody}</p>
      </div>
    )
  }

  if (status === "uploading") {
    const percent = progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0
    return (
      <div className="grid gap-4" role="status">
        <p className="text-xl font-bold break-keep">{t.uploadingTitle}</p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={t.uploadingTitle}
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200 ease-[var(--ease-standard)] motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {percent}% · {t.uploadingHint}
        </p>
      </div>
    )
  }

  if (status === "failed") {
    return (
      <div className="grid gap-3" role="alert">
        <p className="text-xl font-bold break-keep">{t.failTitle}</p>
        <p className="text-muted-foreground">{failBody}</p>
        {/* 이력서는 메일에 자동으로 붙지 않는다. 가장 놓치기 쉬운 일이라 굵게 따로 둔다. */}
        <p className="font-semibold text-foreground">{t.attachNotice}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button nativeButton={false} render={<a href={mailtoHref} />}>
            {t.failMailto}
          </Button>
          <Button variant="outline" onClick={reset}>
            {t.reset}
          </Button>
        </div>
      </div>
    )
  }

  const sending = status === "sending"

  return (
    <form onSubmit={handleSubmit} onFocusCapture={markStart} noValidate className="grid gap-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={t.name} htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            maxLength={APPLICATION_MAX.name}
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label={t.department} htmlFor="department" required error={errors.department}>
          <Input
            id="department"
            name="department"
            maxLength={APPLICATION_MAX.department}
            placeholder={t.departmentPlaceholder}
            aria-invalid={!!errors.department}
          />
        </Field>
        <Field label={t.studentId} htmlFor="studentId" required error={errors.studentId}>
          <Input
            id="studentId"
            name="studentId"
            inputMode="numeric"
            maxLength={APPLICATION_MAX.studentId}
            placeholder={t.studentIdPlaceholder}
            aria-invalid={!!errors.studentId}
          />
        </Field>
        <Field label={t.grade} htmlFor="grade" required error={errors.grade}>
          <select
            id="grade"
            name="grade"
            defaultValue=""
            aria-invalid={!!errors.grade}
            className={SELECT_CLASS}
          >
            <option value="" disabled>
              {t.gradePlaceholder}
            </option>
            {t.gradeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.graduation} htmlFor="graduation" required error={errors.graduation}>
          <Input
            id="graduation"
            name="graduation"
            maxLength={APPLICATION_MAX.graduation}
            placeholder={t.graduationPlaceholder}
            aria-invalid={!!errors.graduation}
          />
        </Field>
        <Field label={t.phone} htmlFor="phone" required error={errors.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={APPLICATION_MAX.phone}
            // 숫자만 쳐도 · 붙여 넣어도 010-1234-5678 꼴로 맞춘다(lib/phone.ts). 값은 폼이 제출 때 읽으므로
            // 상태로 들고 있지 않고 입력 칸의 값을 바로 고친다.
            onInput={(e) => {
              const el = e.currentTarget
              const next = formatPhone(el.value)
              if (next !== el.value) el.value = next
            }}
            placeholder={t.phonePlaceholder}
            aria-invalid={!!errors.phone}
          />
        </Field>
        <Field
          label={t.email}
          htmlFor="email"
          required
          error={errors.email}
          className="sm:col-span-2"
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={APPLICATION_MAX.email}
            placeholder={t.emailPlaceholder}
            aria-invalid={!!errors.email}
          />
        </Field>
      </div>

      <Field label={t.resume} htmlFor="resume" required error={errors.resume} hint={t.resumeHint}>
        <Input
          id="resume"
          name="resume"
          type="file"
          accept="application/pdf,.pdf"
          aria-invalid={!!errors.resume}
          aria-describedby="resume-hint"
          className="h-auto py-2"
        />
      </Field>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold">{t.portfolio}</legend>
        <p className="-mt-1 text-sm text-muted-foreground">{t.portfolioHint}</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={t.portfolioFile} htmlFor="portfolioFile" error={errors.portfolioFile} subtle>
            <Input
              id="portfolioFile"
              name="portfolioFile"
              type="file"
              accept="application/pdf,.pdf"
              aria-invalid={!!errors.portfolioFile}
              className="h-auto py-2"
            />
          </Field>
          <Field label={t.portfolioUrl} htmlFor="portfolioUrl" error={errors.portfolioUrl} subtle>
            <Input
              id="portfolioUrl"
              name="portfolioUrl"
              type="url"
              inputMode="url"
              maxLength={APPLICATION_MAX.portfolioUrl}
              placeholder={t.portfolioUrlPlaceholder}
              aria-invalid={!!errors.portfolioUrl}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold">{t.interests}</legend>
        <p className="-mt-1 text-sm text-muted-foreground">{t.interestsHint}</p>
        <div className="grid gap-2">
          {job.tracks.map((track) => (
            <label key={track.value} className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="interests"
                value={track.value}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span className="break-keep">{track.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={t.motivation} htmlFor="motivation" required error={errors.motivation}>
        <Textarea
          id="motivation"
          name="motivation"
          rows={6}
          maxLength={APPLICATION_MAX.motivation}
          placeholder={t.motivationPlaceholder}
          aria-invalid={!!errors.motivation}
          aria-describedby="motivation-count"
          onChange={(e) => setMotivationLength(e.currentTarget.value.length)}
          className="min-h-36"
        />
        <p id="motivation-count" className="text-right text-xs text-muted-foreground tabular-nums">
          {t.charCount
            .replace("{n}", String(motivationLength))
            .replace("{max}", String(APPLICATION_MAX.motivation))}
        </p>
      </Field>

      {/* 허니팟. 문의 폼과 같은 이름·같은 방식이다. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <section aria-labelledby="consent-title" className="grid gap-4 rounded-lg border border-border p-5">
        <h3 id="consent-title" className="text-sm font-bold">
          {t.consentTitle}
        </h3>
        {/* 표는 좁은 폭에서 칸이 눌리므로 항목마다 줄을 나눠 정의 목록으로 그린다. */}
        <dl className="grid gap-3 text-sm">
          {t.consentTable.head.map((head, i) => (
            <div key={head} className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <dt className="font-semibold text-muted-foreground">{head}</dt>
              <dd className="break-keep">{t.consentTable.rows[0]?.[i]}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">{t.consentRefusal}</p>
        <div className="grid gap-1">
          <label className="flex items-start gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              id="consent"
              name="consent"
              className="mt-0.5 size-4 shrink-0 accent-primary"
              aria-invalid={!!errors.consent}
            />
            <span>
              {t.consent} <span className="text-status-danger">*</span>
            </span>
          </label>
          {errors.consent ? <p className="pl-7 text-sm text-status-danger">{errors.consent}</p> : null}
        </div>
      </section>

      <div className="grid gap-3">
        <Button type="submit" size="lg" disabled={sending} className="w-full sm:w-auto sm:justify-self-start">
          {sending ? t.submitting : t.submit}
        </Button>
      </div>
    </form>
  )
}

/** 접수가 실패했을 때 쓰는 메일 되돌림. 받는 곳은 사이트의 대표 메일이다. */
function buildMailto(
  email: string,
  job: JobPosting,
  t: Form,
  p: ApplicationPayload
): string {
  const grade = t.gradeOptions.find((o) => o.value === p.grade)?.label ?? p.grade
  const files = [p.resume?.name, p.portfolioFile?.name].filter(Boolean).join(", ")
  const body = [
    job.title,
    "",
    `${t.name}: ${p.name}`,
    `${t.department}: ${p.department}`,
    `${t.studentId}: ${p.studentId}`,
    `${t.grade}: ${grade}`,
    `${t.graduation}: ${p.graduation}`,
    `${t.phone}: ${p.phone}`,
    `${t.email}: ${p.email}`,
    `${t.portfolioUrl}: ${p.portfolioUrl}`,
    `${t.interests}: ${p.interests
      .map((v) => job.tracks.find((tr) => tr.value === v)?.label ?? v)
      .join(", ")}`,
    "",
    `${t.motivation}:`,
    p.motivation,
    "",
    t.mailAttachNote,
    files ? `(${files})` : "",
  ].join("\n")
  const subject = `[${t.mailSubjectPrefix}] ${job.title} - ${p.name}`
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  subtle,
  className,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  hint?: string
  subtle?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <Label
        htmlFor={htmlFor}
        className={cn("text-sm", subtle ? "font-medium text-muted-foreground" : "font-semibold")}
      >
        {label}
        {required ? <span className="ml-0.5 text-status-danger">*</span> : null}
      </Label>
      {children}
      {hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? <p className="text-sm text-status-danger">{error}</p> : null}
    </div>
  )
}

/** 폼을 만난 뒤 지난 시간(ms). 봇 거르기에 쓴다. 제출 처리기에서만 부른다. */
function elapsedSince(start: number | null): number {
  const now = Date.now()
  return now - (start ?? now)
}

/** 옴니스가 연 지원서(① 의 응답, 계약 2절). */
interface Opened {
  id: string
  duplicate?: boolean
  code?: string
  uploads: UploadTicket[]
}

/** FormData 의 파일 칸. 고르지 않으면 브라우저가 이름 없는 빈 File 을 넣는다. */
function fileOf(data: FormData, key: string): File | null {
  const f = data.get(key)
  return f instanceof File && f.name !== "" ? f : null
}

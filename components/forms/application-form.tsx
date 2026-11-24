"use client"

import * as React from "react"

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
 * ApplicationForm — `POST /api/career/apply` 로 보낸다.
 *
 * 문의 폼(`contact-form.tsx`)과 같은 불변식을 지킨다: 접수가 실패하면 작성한 내용을 담은 `mailto:`
 * 로 되돌려 지원서를 잃지 않는다. 받을 곳이 정해지기 전(2026-11-24)에는 API 가 늘 503 을 주므로
 * 지금은 이 되돌림이 실제 접수 경로다. 메일에는 파일을 붙일 수 없으니 첨부해 달라고 적는다.
 *
 * 봇 거르기도 문의 폼과 같다 — 허니팟 칸 `company` 와 폼을 만난 뒤 지난 시간 `elapsedMs`.
 */
export function ApplicationForm({
  form: t,
  email,
  lang,
  job,
}: {
  form: Form
  /** 메일 되돌림을 받을 주소. */
  email: string
  lang: Lang
  job: JobPosting
}) {
  const [errors, setErrors] = React.useState<Errors>({})
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "failed">("idle")
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

    try {
      const res = await fetch("/api/career/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          lang,
          company: value("company"),
          elapsedMs: Date.now() - (startedAt.current ?? Date.now()),
        }),
      })

      if (res.ok) {
        setStatus("sent")
        return
      }
      if (res.status === 429) {
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
          setStatus("idle")
          return
        }
      }
      setFailBody(t.failBody)
      setStatus("failed")
    } catch {
      setFailBody(t.failBody)
      setStatus("failed")
    }
  }

  const reset = () => {
    setErrors({})
    setFailBody(t.failBody)
    setMailtoHref("")
    setMotivationLength(0)
    startedAt.current = Date.now()
    setStatus("idle")
  }

  if (status === "sent") {
    return (
      <div className="grid gap-3" role="status">
        <p className="text-xl font-bold break-keep">{t.successTitle}</p>
        <p className="text-muted-foreground">{t.successBody}</p>
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
            autoComplete="tel"
            maxLength={APPLICATION_MAX.phone}
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
        <p className="text-sm font-semibold">{t.attachNotice}</p>
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

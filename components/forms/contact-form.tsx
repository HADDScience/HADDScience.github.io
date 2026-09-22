"use client"

import Link from "next/link"
import * as React from "react"

import { SurfaceCard } from "@/components/ds/primitives"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { localePath, type Lang } from "@/content"
import type { SiteContent } from "@/content/types"
import { cn } from "@/lib/utils"

type Field = "name" | "organization" | "email" | "phone" | "message" | "consent"
type Issue = "required" | "invalidEmail" | "tooLong"

type Errors = Partial<Record<Field, string>>

/** 서버와 같은 상한. 여기서 막아 두면 방문자가 서버 오류를 보지 않는다. */
const MAX = {
  name: 100,
  organization: 200,
  email: 200,
  phone: 50,
  message: 5000,
} as const

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * ContactForm — `POST /api/contact` 으로 보낸다. 그 라우트가 공유 비밀을 붙여 Omnis 의
 * 문의함(`WebsiteInquiry`)으로 넘기고, 사람이 승인해야 CRM 의 기관·담당자·견적이 된다.
 *
 * 접수가 실패하면 예전처럼 `mailto:` 로 되돌린다. Omnis 가 죽어도 문의를 잃지 않는 것이
 * 이 폼의 불변식이다 — 회사 홈페이지가 업무 시스템의 가동시간에 묶이지 않는다.
 */
export function ContactForm({
  content,
  lang,
}: {
  content: SiteContent
  lang: Lang
}) {
  const t = content.contact.form
  const [errors, setErrors] = React.useState<Errors>({})
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "failed">("idle")
  /** 실패 화면의 본문. 레이트리밋은 원인이 다르므로 다른 문구를 쓴다. */
  const [failBody, setFailBody] = React.useState(t.failBody)
  /** 실패했을 때 되돌림 링크에 쓸 `mailto:` 주소. 제출한 내용을 그대로 담는다. */
  const [mailtoHref, setMailtoHref] = React.useState("")

  /**
   * 방문자가 이 폼을 만나기 시작한 시각. 제출까지 3초가 안 걸렸으면 서버가 봇으로 본다.
   *
   * 마운트 효과에서 한 번 잡고, 첫 포커스에서도 잡는다. 효과가 먼저 도니 포커스 쪽은
   * 평소에 하는 일이 없지만, 둘 다 돌지 않은 채 제출이 오는 일은 없어야 한다 —
   * 그때는 사람이 쓴 문의가 조용히 버려진다.
   */
  const startedAt = React.useRef<number | null>(null)
  const markStart = React.useCallback(() => {
    startedAt.current ??= Date.now()
  }, [])
  React.useEffect(markStart, [markStart])

  const messageOf = (issue: Issue): string =>
    issue === "invalidEmail" ? t.invalidEmail : issue === "tooLong" ? t.tooLong : t.required

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === "sending") return

    const data = new FormData(event.currentTarget)
    const value = (key: string) => String(data.get(key) ?? "").trim()
    const payload = {
      name: value("name"),
      organization: value("organization"),
      email: value("email"),
      phone: value("phone"),
      topic: value("topic"),
      message: value("message"),
      consent: data.get("consent") !== null,
      lang,
      // 허니팟. 사람은 비워 두고, 봇은 "회사" 라는 이름을 보고 채운다.
      company: value("company"),
      elapsedMs: Date.now() - (startedAt.current ?? Date.now()),
    }

    const next: Errors = {}
    const require = (field: keyof typeof MAX) => {
      if (payload[field] === "") next[field] = t.required
      else if (payload[field].length > MAX[field]) next[field] = t.tooLong
    }
    require("name")
    require("email")
    require("message")
    if (payload.organization.length > MAX.organization) next.organization = t.tooLong
    if (payload.phone.length > MAX.phone) next.phone = t.tooLong
    if (!next.email && !EMAIL.test(payload.email)) next.email = t.invalidEmail
    if (!payload.consent) next.consent = t.required

    setErrors(next)
    if (Object.keys(next).length > 0) return

    // 실패했을 때 쓸 되돌림 주소를 먼저 만들어 둔다 — 그때 폼은 이미 사라져 있다.
    setMailtoHref(buildMailto(content, t, payload))
    setStatus("sending")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      // 400 은 서버가 우리와 다르게 판단한 경우다. 필드를 알려 주면 그 칸에 표시하고,
      // 알려 주지 않으면 일반 실패로 다룬다.
      if (res.status === 400) {
        const body = (await res.json().catch(() => null)) as {
          fields?: Partial<Record<Field, Issue>>
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
      // 네트워크가 끊긴 경우. 서버에 닿지 못했으니 접수되지 않았다.
      setFailBody(t.failBody)
      setStatus("failed")
    }
  }

  const reset = () => {
    setErrors({})
    setFailBody(t.failBody)
    setMailtoHref("")
    startedAt.current = Date.now()
    setStatus("idle")
  }

  if (status === "sent") {
    return (
      <SurfaceCard variant="tint" className="grid gap-3 p-8">
        <p className="text-xl font-bold">{t.successTitle}</p>
        <p className="text-muted-foreground">{t.successBody}</p>
        <div>
          <Button variant="outline" onClick={reset} className="mt-2">
            {t.reset}
          </Button>
        </div>
      </SurfaceCard>
    )
  }

  if (status === "failed") {
    return (
      <SurfaceCard variant="tint" className="grid gap-3 p-8">
        <p className="text-xl font-bold">{t.failTitle}</p>
        <p className="text-muted-foreground">{failBody}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button render={<a href={mailtoHref} />}>{t.failMailto}</Button>
          <Button variant="outline" onClick={reset}>
            {t.reset}
          </Button>
        </div>
      </SurfaceCard>
    )
  }

  const sending = status === "sending"

  return (
    <form
      onSubmit={handleSubmit}
      onFocusCapture={markStart}
      noValidate
      className="grid gap-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={t.name} htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            name="name"
            maxLength={MAX.name}
            placeholder={t.namePlaceholder}
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label={t.organization} htmlFor="organization" error={errors.organization}>
          <Input
            id="organization"
            name="organization"
            maxLength={MAX.organization}
            placeholder={t.organizationPlaceholder}
            aria-invalid={!!errors.organization}
          />
        </Field>
        <Field label={t.email} htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            maxLength={MAX.email}
            placeholder={t.emailPlaceholder}
            aria-invalid={!!errors.email}
          />
        </Field>
        <Field label={t.phone} htmlFor="phone" error={errors.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            maxLength={MAX.phone}
            placeholder={t.phonePlaceholder}
            aria-invalid={!!errors.phone}
          />
        </Field>
      </div>

      <Field label={t.topic} htmlFor="topic">
        <select
          id="topic"
          name="topic"
          defaultValue={t.topicOptions[0]?.value}
          className="h-12 w-full rounded-[6px] border border-input bg-background px-4 text-base transition-colors duration-120 ease-[var(--ease-standard)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          {t.topicOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={t.message}
        htmlFor="message"
        required
        error={errors.message}
      >
        <Textarea
          id="message"
          name="message"
          rows={7}
          maxLength={MAX.message}
          placeholder={t.messagePlaceholder}
          aria-invalid={!!errors.message}
        />
      </Field>

      {/*
        허니팟. 화면 밖으로 밀어 두고 자동완성·탭 이동·스크린리더에서 모두 뺀다.
        `display:none` 을 쓰지 않는 이유는 그것만 보고 건너뛰는 봇이 있기 때문이다.
        사람이 이 칸을 채울 길은 없고, 채워져 오면 서버가 조용히 버린다.
      */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-1">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="consent"
            className="mt-1 size-4 shrink-0 accent-primary"
            aria-invalid={!!errors.consent}
          />
          <span>
            {t.consent} <span className="text-status-danger">*</span>{" "}
            {/*
              무엇에 동의하는지 읽을 수 있어야 한다. 새 탭으로 여는 이유는, 같은 탭에서
              나가면 지금까지 쓴 문의가 사라지기 때문이다.
            */}
            <Link
              href={localePath(lang, "/privacy")}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors duration-120 ease-[var(--ease-standard)] hover:text-primary"
            >
              {content.footer.privacy}
            </Link>
          </span>
        </label>
        {errors.consent ? (
          <p className="pl-7 text-sm text-status-danger">{errors.consent}</p>
        ) : null}
      </div>

      <div>
        <Button type="submit" size="lg" disabled={sending}>
          {sending ? t.submitting : t.submit}
        </Button>
      </div>
    </form>
  )
}

/** 접수가 실패했을 때 쓰는 되돌림. 2026-09-22 까지는 이것이 유일한 제출 경로였다. */
function buildMailto(
  content: SiteContent,
  t: SiteContent["contact"]["form"],
  payload: {
    name: string
    organization: string
    email: string
    phone: string
    topic: string
    message: string
  }
): string {
  const topicLabel =
    t.topicOptions.find((o) => o.value === payload.topic)?.label ?? payload.topic
  const body = [
    `${t.name}: ${payload.name}`,
    `${t.organization}: ${payload.organization}`,
    `${t.email}: ${payload.email}`,
    `${t.phone}: ${payload.phone}`,
    `${t.topic}: ${topicLabel}`,
    "",
    payload.message,
  ].join("\n")

  const subject = `[${content.ui.inquirySubjectPrefix}] ${topicLabel} - ${payload.name}`
  return `mailto:${content.company.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
        {required ? <span className="ml-0.5 text-status-danger">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className={cn("text-sm text-status-danger")}>{error}</p>
      ) : null}
    </div>
  )
}

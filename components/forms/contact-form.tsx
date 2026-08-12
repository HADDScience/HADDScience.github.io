"use client"

import * as React from "react"

import { SurfaceCard } from "@/components/ds/primitives"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SiteContent } from "@/content/types"
import { cn } from "@/lib/utils"

type Errors = Partial<Record<"name" | "email" | "message" | "consent", string>>

/**
 * ContactForm — 아직 백엔드가 없다.
 * 제출은 `mailto:` 로 사용자의 메일 클라이언트를 열어 넘긴다. 서버 수신함
 * (Resend / Formspree / 자체 API route) 이 정해지면 handleSubmit 만 교체하면 된다.
 */
export function ContactForm({ content }: { content: SiteContent }) {
  const t = content.contact.form
  const [errors, setErrors] = React.useState<Errors>({})
  const [sent, setSent] = React.useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const value = (key: string) => String(data.get(key) ?? "").trim()

    const next: Errors = {}
    if (!value("name")) next.name = t.required
    if (!value("email")) next.email = t.required
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email")))
      next.email = t.invalidEmail
    if (!value("message")) next.message = t.required
    if (!data.get("consent")) next.consent = t.required

    setErrors(next)
    if (Object.keys(next).length > 0) return

    const topicLabel =
      t.topicOptions.find((o) => o.value === value("topic"))?.label ??
      value("topic")
    const body = [
      `${t.name}: ${value("name")}`,
      `${t.organization}: ${value("organization")}`,
      `${t.email}: ${value("email")}`,
      `${t.phone}: ${value("phone")}`,
      `${t.topic}: ${topicLabel}`,
      "",
      value("message"),
    ].join("\n")

    window.location.href = `mailto:${content.company.email}?subject=${encodeURIComponent(
      `[${content.ui.inquirySubjectPrefix}] ${topicLabel} - ${value("name")}`
    )}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  if (sent) {
    return (
      <SurfaceCard variant="tint" className="grid gap-3 p-8">
        <p className="text-xl font-bold">{t.successTitle}</p>
        <p className="text-muted-foreground">{t.successBody}</p>
        <div>
          <Button
            variant="outline"
            onClick={() => setSent(false)}
            className="mt-2"
          >
            {t.reset}
          </Button>
        </div>
      </SurfaceCard>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={t.name} htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            name="name"
            placeholder={t.namePlaceholder}
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label={t.organization} htmlFor="organization">
          <Input
            id="organization"
            name="organization"
            placeholder={t.organizationPlaceholder}
          />
        </Field>
        <Field label={t.email} htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t.emailPlaceholder}
            aria-invalid={!!errors.email}
          />
        </Field>
        <Field label={t.phone} htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder={t.phonePlaceholder}
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
          placeholder={t.messagePlaceholder}
          aria-invalid={!!errors.message}
        />
      </Field>

      <div className="grid gap-1">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="consent"
            className="mt-1 size-4 shrink-0 accent-primary"
            aria-invalid={!!errors.consent}
          />
          <span>
            {t.consent} <span className="text-status-danger">*</span>
          </span>
        </label>
        {errors.consent ? (
          <p className="pl-7 text-sm text-status-danger">{errors.consent}</p>
        ) : null}
      </div>

      <div>
        <Button type="submit" size="lg">
          {t.submit}
        </Button>
      </div>
    </form>
  )
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

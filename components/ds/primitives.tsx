import * as React from "react"

import { NumberTicker } from "@/components/ui/number-ticker"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------
 * Container — 1280px, 32px gutter (tokens/spacing.css)
 * ---------------------------------------------------------------------- */
export function Container({
  className,
  narrow,
  ...props
}: React.ComponentProps<"div"> & { narrow?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 md:px-8",
        narrow ? "max-w-[840px]" : "max-w-[1280px]",
        className
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------
 * Section — 120px 리듬, compact 80px. 배경 밴드는 flat white / neutral-50 /
 * brand-blue-50 세 가지만 허용한다 (readme: VISUAL FOUNDATIONS).
 * ---------------------------------------------------------------------- */
const sectionTones = {
  page: "bg-background",
  subtle: "bg-muted",
  tint: "bg-brand-blue-50",
  inverse: "bg-brand-blue-900 text-white",
} as const

export function Section({
  className,
  tone = "page",
  compact,
  ...props
}: React.ComponentProps<"section"> & {
  tone?: keyof typeof sectionTones
  compact?: boolean
}) {
  return (
    <section
      className={cn(
        sectionTones[tone],
        compact ? "py-14 md:py-20" : "py-20 md:py-30",
        className
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------
 * Eyebrow — 유일하게 자간을 벌리는 타입. 항상 대문자 라틴.
 * ---------------------------------------------------------------------- */
export function Eyebrow({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"p"> & { tone?: "default" | "inverse" }) {
  return (
    <p
      className={cn(
        "text-[13px] leading-[1.2] font-bold tracking-[0.14em] uppercase",
        tone === "inverse" ? "text-brand-blue-300" : "text-brand-blue-500",
        className
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------
 * SectionHeading — eyebrow + title + description
 * ---------------------------------------------------------------------- */
export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "default",
  className,
  as: Heading = "h2",
}: {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  tone?: "default" | "inverse"
  className?: string
  as?: "h1" | "h2" | "h3"
}) {
  return (
    <div className={cn("grid max-w-2xl gap-4", className)}>
      {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
      <Heading
        className={cn(
          "text-3xl font-bold text-balance md:text-4xl",
          tone === "inverse" ? "text-white" : "text-foreground"
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={cn(
            "text-lg",
            tone === "inverse" ? "text-white/72" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------
 * Tag — pill. Badge — 4px 라디우스의 "도장".
 * ---------------------------------------------------------------------- */
const tagTones = {
  brand: "bg-brand-blue-50 text-brand-blue-700",
  neutral: "bg-muted text-muted-foreground",
  accent: "bg-brand-orange-100 text-brand-orange-600",
  inverse: "bg-white/12 text-white",
} as const

export function Tag({
  className,
  tone = "brand",
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof tagTones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tagTones[tone],
        className
      )}
      {...props}
    />
  )
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<"span"> & {
  tone?: "neutral" | "success" | "warning"
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-status-success-bg text-status-success",
    warning: "bg-status-warning-bg text-status-warning",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        tones[tone],
        className
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------
 * SurfaceCard — 16px 라디우스, 흰 배경, 1px hairline, shadow-sm.
 * interactive 면 4px 떠오르고 shadow-lg 로 깊어진다.
 * ---------------------------------------------------------------------- */
const cardVariants = {
  default: "bg-card border-border shadow-ds-sm",
  flat: "bg-muted border-transparent",
  outline: "bg-card border-input",
  tint: "bg-brand-blue-50 border-brand-blue-100",
  inverse: "bg-brand-blue-900 border-transparent text-white",
} as const

export function SurfaceCard({
  className,
  variant = "default",
  interactive,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: keyof typeof cardVariants
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-200 ease-[var(--ease-standard)]",
        cardVariants[variant],
        interactive && "hover:-translate-y-1 hover:shadow-ds-lg",
        className
      )}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------
 * FeatureItem — 아이콘 세트가 없으므로 번호 라벨 + 2px 블루 룰을 쓴다.
 * (readme: ICONOGRAPHY — "Do not draw icons.")
 * ---------------------------------------------------------------------- */
export function FeatureItem({
  index,
  title,
  description,
}: {
  index: string
  title: string
  description: string
}) {
  return (
    <div className="grid gap-3 border-t-2 border-primary pt-5">
      <span className="font-mono text-sm font-bold text-brand-blue-500">
        {index}
      </span>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

/* -------------------------------------------------------------------------
 * StatBlock — 숫자 + 오렌지 suffix (오렌지는 뷰당 한 종류만).
 * ---------------------------------------------------------------------- */
export function StatBlock({
  value,
  suffix,
  label,
  delay = 0,
}: {
  value: string
  suffix?: string
  label: string
  delay?: number
}) {
  // 숫자만으로 된 값은 스크롤에 들어올 때 카운트업한다.
  // "2024" 같은 연도도 숫자지만 세는 게 자연스러우므로 함께 적용한다.
  const numeric = /^\d+$/.test(value) ? Number(value) : null

  return (
    <div className="grid gap-2">
      <p className="text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
        {numeric === null ? (
          value
        ) : (
          <NumberTicker
            value={numeric}
            delay={delay}
            // 연도는 1000 단위 구분 없이 그대로 읽혀야 한다.
            useGrouping={value.length !== 4}
            className="tracking-[-0.03em] text-foreground"
          />
        )}
        {suffix ? (
          <span className="ml-1 text-2xl font-bold text-brand-orange-500">
            {suffix}
          </span>
        ) : null}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

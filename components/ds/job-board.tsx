"use client"

import Link from "next/link"
import * as React from "react"

import { Badge, SurfaceCard, Tag } from "@/components/ds/primitives"
import { Input } from "@/components/ui/input"
import { localePath, type Lang } from "@/content"
import type { SiteContent } from "@/content/types"
import { cn } from "@/lib/utils"

/**
 * 공고 목록 — 왼쪽 필터 · 위 검색 · 공고 줄. 공고가 몇 개 되지 않으므로 거르기는 브라우저에서 한다.
 * 필터 값을 주소에 싣지 않는 이유: 페이지가 정적으로 구워지고, 공유할 만큼 공고가 많지 않다.
 */
export function JobBoard({ lang, career: c }: { lang: Lang; career: SiteContent["career"] }) {
  const [query, setQuery] = React.useState("")
  const [field, setField] = React.useState<string | null>(null)
  const [type, setType] = React.useState<string | null>(null)

  const q = query.trim().toLowerCase()
  const jobs = c.jobs.filter((job) => {
    if (field && job.field !== field) return false
    if (type && job.type !== type) return false
    if (q === "") return true
    const haystack = [job.title, job.summary, ...job.tags].join(" ").toLowerCase()
    return haystack.includes(q)
  })
  const filtered = query !== "" || field !== null || type !== null
  const labelOf = (list: { value: string; label: string }[], value: string) =>
    list.find((o) => o.value === value)?.label ?? value

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
      <aside className="grid content-start gap-8">
        <FilterGroup
          label={c.list.fieldLabel}
          all={c.list.all}
          options={c.fields}
          value={field}
          onChange={setField}
        />
        <FilterGroup
          label={c.list.typeLabel}
          all={c.list.all}
          options={c.types}
          value={type}
          onChange={setType}
        />
      </aside>

      <div className="grid content-start gap-6">
        <div className="grid gap-2">
          <label htmlFor="job-search" className="sr-only">
            {c.list.searchLabel}
          </label>
          <Input
            id="job-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder={c.list.searchPlaceholder}
            className="h-12 px-5"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-muted-foreground" aria-live="polite">
            {c.list.count.replace("{n}", String(jobs.length))}
          </p>
          {filtered ? (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setField(null)
                setType(null)
              }}
              className="text-sm font-semibold text-primary transition-colors duration-120 ease-[var(--ease-standard)] hover:text-brand-blue-500"
            >
              {c.list.reset}
            </button>
          ) : null}
        </div>

        {jobs.length === 0 ? (
          <SurfaceCard variant="flat" className="p-10 text-center text-muted-foreground">
            {c.list.empty}
          </SurfaceCard>
        ) : (
          <ul className="grid gap-4">
            {jobs.map((job) => (
              <li key={job.slug}>
                <Link
                  href={localePath(lang, `/career/${job.slug}`)}
                  className="group block rounded-lg focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                >
                  <SurfaceCard interactive className="grid gap-4 p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={job.status === "open" ? "success" : "neutral"}>
                        {job.status === "open" ? c.list.open : c.list.closed}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {labelOf(c.fields, job.field)} · {labelOf(c.types, job.type)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-6">
                      <div className="grid gap-2">
                        <h2 className="text-xl font-bold break-keep transition-colors duration-120 ease-[var(--ease-standard)] group-hover:text-primary md:text-2xl">
                          {job.title}
                        </h2>
                        <p className="text-muted-foreground break-keep">{job.summary}</p>
                      </div>
                      <span
                        aria-hidden
                        className="mt-1 hidden text-2xl text-brand-blue-500 transition-transform duration-200 ease-[var(--ease-standard)] group-hover:translate-x-1 sm:block"
                      >
                        →
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <Tag key={tag} tone="neutral">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </SurfaceCard>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function FilterGroup({
  label,
  all,
  options,
  value,
  onChange,
}: {
  label: string
  all: string
  options: { value: string; label: string }[]
  value: string | null
  onChange: (value: string | null) => void
}) {
  const items = [{ value: null as string | null, label: all }, ...options]
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-3 text-[13px] font-bold tracking-[0.14em] text-brand-blue-500 uppercase">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2 lg:grid lg:justify-items-start">
        {items.map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value ?? "all"}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-120 ease-[var(--ease-standard)]",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-brand-blue-50 hover:text-brand-blue-700"
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

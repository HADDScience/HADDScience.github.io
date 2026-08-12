import Link from "next/link"
import * as React from "react"

import { Container } from "@/components/ds/primitives"

/**
 * PageHeader — navy 밴드. Hero 와 달리 그라디언트를 쓰지 않는다
 * (디자인시스템은 그라디언트를 히어로 하나로 제한한다).
 */
export function PageHeader({
  breadcrumb,
  title,
  description,
  links,
  activeHref,
}: {
  breadcrumb: string
  title: string
  description?: string
  links?: { label: string; href: string }[]
  activeHref?: string
}) {
  return (
    <header className="bg-brand-blue-900 text-white">
      <Container className="py-14 md:py-20">
        <nav
          aria-label="breadcrumb"
          className="text-[13px] font-semibold tracking-[0.14em] text-brand-blue-300 uppercase"
        >
          {breadcrumb}
          <span aria-hidden className="mx-2 opacity-50">
            ›
          </span>
          <span className="tracking-normal text-white/70 normal-case">
            {title}
          </span>
        </nav>
        <h1 className="mt-4 text-3xl leading-[1.2] font-bold tracking-[-0.02em] text-balance md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg text-white/72">{description}</p>
        ) : null}
        {links?.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {links.map((l) => {
              const active = l.href === activeHref
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-blue-900"
                      : "rounded-full border border-white/28 px-4 py-2 text-sm font-medium text-white/80 transition-colors duration-120 ease-[var(--ease-standard)] hover:bg-white/10 hover:text-white"
                  }
                >
                  {l.label}
                </Link>
              )
            })}
          </div>
        ) : null}
      </Container>
    </header>
  )
}

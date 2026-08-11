import Link from "next/link"
import * as React from "react"

import { Container } from "@/components/ds/primitives"
import { localePath, type Lang } from "@/content"
import type { SiteContent } from "@/content/types"

export function Footer({ lang, content }: { lang: Lang; content: SiteContent }) {
  const { company, footer, ui } = content

  return (
    <footer className="bg-brand-blue-900 text-white/72">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="grid content-start gap-4">
            <p className="text-xl font-bold text-white">{company.nameEn}</p>
            <p className="text-brand-blue-300 text-sm font-semibold">{footer.tagline}</p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {footer.columns.map((col) => (
              <nav key={col.title} className="grid content-start gap-3">
                <p className="text-[13px] font-bold tracking-[0.14em] text-white uppercase">
                  {col.title}
                </p>
                {col.links.map((link) => (
                  <Link
                    key={link.href}
                    href={localePath(lang, link.href)}
                    className="text-sm transition-colors duration-120 ease-[var(--ease-standard)] hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-8 border-t border-white/14 pt-10 lg:grid-cols-[1.2fr_2fr]">
          <div className="grid content-start gap-1 text-sm">
            <p className="font-semibold text-white">{ui.mainLine} {company.tel}</p>
            <p>{ui.fax} {company.fax}</p>
            <p>
              <a
                href={`mailto:${company.email}`}
                className="transition-colors duration-120 ease-[var(--ease-standard)] hover:text-white"
              >
                {company.email}
              </a>
            </p>
          </div>
          <address className="grid gap-2 text-sm not-italic">
            {company.locations.map((loc) => (
              <p key={loc.kind}>
                <span className="text-white/50">{loc.kind}</span> {loc.address}
              </p>
            ))}
          </address>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/14 pt-8 text-xs text-white/50">
          {footer.legal.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-white/50">
          <p>{footer.copyright}</p>
          <div className="flex gap-4">
            <Link
              href={localePath(lang, "/terms")}
              className="transition-colors duration-120 ease-[var(--ease-standard)] hover:text-white"
            >
              {footer.terms}
            </Link>
            <Link
              href={localePath(lang, "/privacy")}
              className="transition-colors duration-120 ease-[var(--ease-standard)] hover:text-white"
            >
              {footer.privacy}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}

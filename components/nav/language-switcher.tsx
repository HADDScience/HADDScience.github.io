"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { AVAILABLE_LANGS, LANGS, type Lang } from "@/content"
import { cn } from "@/lib/utils"

const LABELS: Record<Lang, string> = { ko: "KO", en: "EN" }

/**
 * LanguageSwitcher — 다국어가 이번 개편의 이유이므로 푸터 링크가 아니라
 * 헤더의 1급 컨트롤로 둔다. 콘텐츠가 아직 없는 언어는 비활성으로 표시한다.
 */
export function LanguageSwitcher({
  lang,
  labels,
}: {
  lang: Lang
  labels: { languageSelect: string; languageNotReady: string }
}) {
  const pathname = usePathname()
  const rest = pathname.replace(/^\/[^/]+/, "") || ""

  return (
    <div
      role="group"
      aria-label={labels.languageSelect}
      className="border-border flex items-center gap-0.5 rounded-full border p-0.5"
    >
      {LANGS.map((code) => {
        const active = code === lang
        const ready = AVAILABLE_LANGS.includes(code)
        const className = cn(
          "rounded-full px-2.5 py-1 text-xs font-bold transition-colors duration-120 ease-[var(--ease-standard)]",
          active && "bg-primary text-primary-foreground",
          !active && ready && "text-muted-foreground hover:text-foreground",
          !ready && "text-muted-foreground/40 cursor-not-allowed"
        )

        if (!ready) {
          return (
            <span
              key={code}
              className={className}
              aria-disabled="true"
              title={labels.languageNotReady}
            >
              {LABELS[code]}
            </span>
          )
        }

        return (
          <Link
            key={code}
            href={`/${code}${rest}`}
            aria-current={active ? "true" : undefined}
            className={className}
          >
            {LABELS[code]}
          </Link>
        )
      })}
    </div>
  )
}

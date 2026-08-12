import Link from "next/link"
import * as React from "react"

import { cn } from "@/lib/utils"

/** Pagination — 유니코드 ‹ › 만 쓴다 (디자인시스템에 아이콘 세트 없음). */
export function Pagination({
  page,
  totalPages,
  hrefFor,
  labels,
}: {
  page: number
  totalPages: number
  hrefFor: (page: number) => string
  labels: { pagination: string; prevPage: string; nextPage: string }
}) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  const arrow =
    "flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-120 ease-[var(--ease-standard)] hover:bg-muted hover:text-foreground"

  return (
    <nav
      aria-label={labels.pagination}
      className="flex items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          aria-label={labels.prevPage}
          className={arrow}
        >
          <span aria-hidden>‹</span>
        </Link>
      ) : (
        <span
          aria-hidden
          className={cn(arrow, "pointer-events-none opacity-40")}
        >
          ‹
        </span>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-120 ease-[var(--ease-standard)]",
            p === page
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          aria-label={labels.nextPage}
          className={arrow}
        >
          <span aria-hidden>›</span>
        </Link>
      ) : (
        <span
          aria-hidden
          className={cn(arrow, "pointer-events-none opacity-40")}
        >
          ›
        </span>
      )}
    </nav>
  )
}

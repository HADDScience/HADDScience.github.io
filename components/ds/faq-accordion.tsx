"use client"

import * as React from "react"

/**
 * Accordion — 디자인시스템 규칙: 아이콘 대신 `+` 글리프가 45° 회전해 닫기 십자가 된다.
 * <details> 를 쓰면 JS 없이도 열리므로 접근성·점진적 향상 모두 만족한다.
 */
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-border border-t border-b border-border">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold [&::-webkit-details-marker]:hidden">
            <span className="text-balance">{item.q}</span>
            <span
              aria-hidden
              className="shrink-0 text-2xl leading-none font-light text-primary transition-transform duration-200 ease-[var(--ease-standard)] group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="pb-5 text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  )
}

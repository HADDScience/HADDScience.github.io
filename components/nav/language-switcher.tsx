"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { AVAILABLE_LANGS, LANGS, type Lang } from "@/content"
import { cn } from "@/lib/utils"

const LABELS: Record<Lang, string> = { ko: "KO", en: "EN" }

/**
 * LanguageSwitcher — KO / EN 을 버튼 두 개가 아니라 **스위치 하나**로 본다.
 * 누르면 반대 언어로 넘어간다.
 *
 * 링크로 구현한 이유
 *   정적 사이트라 서버가 없다. `<Link>` 면 JS 없이도 동작하고, 크롤러가 두 언어를
 *   서로 발견할 수 있으며, 새 탭으로 열기도 된다. onClick 라우팅으로는 셋 다 잃는다.
 *
 * 현재 경로를 유지한 채 언어만 바꾼다. `/ko/news/page/2` → `/en/news/page/2`.
 */
export function LanguageSwitcher({
  lang,
  labels,
}: {
  lang: Lang
  labels: { languageSelect: string; languageNotReady: string }
}) {
  const pathname = usePathname()
  const rest = pathname.replace(/^\/[^/]+/, "") || "/"

  // 준비된 언어들 중 지금이 아닌 다음 언어. 2개일 때는 곧 토글이다.
  const ready = LANGS.filter((l) => AVAILABLE_LANGS.includes(l))
  const next = ready[(ready.indexOf(lang) + 1) % ready.length] ?? lang
  const isOn = ready.indexOf(lang) === 1

  // 켤 언어가 아직 없으면 스위치를 비활성으로 보여준다.
  if (ready.length < 2) {
    return (
      <span
        aria-disabled="true"
        title={labels.languageNotReady}
        className="flex h-8 cursor-not-allowed items-center rounded-full border border-border px-3 text-xs font-bold text-muted-foreground/60"
      >
        {LABELS[lang]}
      </span>
    )
  }

  return (
    <Link
      href={`/${next}${rest}`}
      role="switch"
      aria-checked={isOn}
      aria-label={labels.languageSelect}
      // hreflang 로 이 링크가 언어 전환임을 명시한다.
      hrefLang={next}
      className={cn(
        "relative flex h-8 w-[4.25rem] shrink-0 items-center rounded-full border border-border",
        "bg-muted transition-colors duration-200 ease-[var(--ease-standard)]",
        "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      )}
    >
      {/* 움직이는 손잡이. 현재 언어 위에 놓인다. */}
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 bottom-0.5 w-[calc(50%-0.125rem)] rounded-full bg-primary",
          "transition-transform duration-200 ease-[var(--ease-standard)]",
          isOn ? "translate-x-[calc(100%+0.125rem)]" : "translate-x-0.5"
        )}
      />
      {ready.map((code) => (
        <span
          key={code}
          aria-hidden
          className={cn(
            "relative z-10 flex-1 text-center text-[11px] font-bold transition-colors duration-200 ease-[var(--ease-standard)]",
            code === lang ? "text-primary-foreground" : "text-muted-foreground"
          )}
        >
          {LABELS[code]}
        </span>
      ))}
    </Link>
  )
}

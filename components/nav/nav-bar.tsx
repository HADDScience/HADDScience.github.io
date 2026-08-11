"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { Container } from "@/components/ds/primitives"
import { LanguageSwitcher } from "@/components/nav/language-switcher"
import { Button } from "@/components/ui/button"
import { localePath, type Lang } from "@/content"
import type { NavItem, SiteContent } from "@/content/types"
import { cn } from "@/lib/utils"

/**
 * NavBar — 디자인시스템에서 투명도+블러가 허용되는 유일한 표면.
 * rgba(255,255,255,.88) + backdrop-blur(16px), 아래에 1px hairline.
 */
export function NavBar({
  lang,
  items,
  cta,
  companyName,
  ui,
}: {
  lang: Lang
  items: NavItem[]
  cta: string
  companyName: string
  ui: SiteContent["ui"]
}) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const close = () => setOpen(false)

  const isActive = (item: NavItem) => {
    const root = localePath(lang, item.href)
    return pathname === root || pathname.startsWith(`${root}/`)
  }

  return (
    <header className="border-border sticky top-0 z-40 border-b bg-background/88 backdrop-blur-[16px] backdrop-saturate-180">
      <Container className="flex h-19 items-center gap-10">
        <Link
          href={localePath(lang, "/")}
          className="flex shrink-0 items-center"
          aria-label={companyName}
        >
          <Image
            src="/logo/logo-primary.png"
            alt={companyName}
            width={1000}
            height={153}
            priority
            className="h-7 w-auto"
          />
        </Link>

        {/* 데스크톱 */}
        <nav className="ml-auto hidden items-center gap-8 lg:flex">
          {items.map((item) => {
            const active = isActive(item)
            return (
              <div key={item.href} className="group relative py-6">
                <Link
                  href={localePath(lang, item.href)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "border-b-2 pb-1 text-sm font-semibold tracking-wide transition-colors duration-120 ease-[var(--ease-standard)]",
                    active
                      ? "text-primary border-primary"
                      : "text-foreground hover:text-primary border-transparent hover:border-primary"
                  )}
                >
                  {item.label}
                </Link>
                {item.children?.length ? (
                  <div className="border-border shadow-ds-md invisible absolute top-full left-1/2 grid w-48 -translate-x-1/2 gap-1 rounded-lg border bg-popover text-popover-foreground p-2 opacity-0 transition-opacity duration-200 ease-[var(--ease-standard)] group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={localePath(lang, child.href)}
                        className="hover:bg-accent hover:text-accent-foreground rounded-[6px] px-3 py-2 text-sm font-medium transition-colors duration-120 ease-[var(--ease-standard)]"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <LanguageSwitcher lang={lang} labels={ui} />
          <Button nativeButton={false} size="sm" className="hidden sm:inline-flex" render={<Link href={localePath(lang, "/contact")} />}>{cta}</Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={ui.menu}
            className="border-border text-foreground flex size-10 items-center justify-center rounded-full border lg:hidden"
          >
            <span aria-hidden className="text-lg leading-none">
              {open ? "×" : "≡"}
            </span>
          </button>
        </div>
      </Container>

      {/* 모바일 */}
      {open ? (
        <div id="mobile-nav" className="border-border border-t bg-background lg:hidden">
          <Container className="grid gap-1 py-4">
            {items.map((item) => (
              <div key={item.href} className="py-2">
                <Link
                  href={localePath(lang, item.href)}
                  onClick={close}
                  className="text-sm font-bold tracking-wide"
                >
                  {item.label}
                </Link>
                {item.children?.length ? (
                  <div className="mt-2 grid gap-1 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={localePath(lang, child.href)}
                        onClick={close}
                        className="text-muted-foreground hover:text-primary py-1 text-sm"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <Button nativeButton={false}
              className="mt-3 w-full"
              render={<Link href={localePath(lang, "/contact")} onClick={close} />}
            >
              {cta}
            </Button>
          </Container>
        </div>
      ) : null}
    </header>
  )
}

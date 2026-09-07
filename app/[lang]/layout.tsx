import type { Metadata } from "next"
import { notFound } from "next/navigation"

import "../globals.css"
import { fontMono, pretendard } from "../fonts"
import { Footer } from "@/components/nav/footer"
import { NavBar } from "@/components/nav/nav-bar"
import { ThemeProvider } from "@/components/theme-provider"
import { AVAILABLE_LANGS, isLang } from "@/content"
import { getContent } from "@/content/server"
import { IS_REVIEW_BUILD } from "@/lib/site-env"
import { cn } from "@/lib/utils"


export function generateStaticParams() {
  return AVAILABLE_LANGS.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  const content = await getContent(lang)
  return {
    title: {
      default: content.meta.title,
      template: `%s | ${content.company.nameEn}`,
    },
    description: content.meta.description,
    // 컨펌용 배포는 robots.txt 를 무시하는 크롤러까지 막기 위해 메타로도 한 번 더 막는다.
    ...(IS_REVIEW_BUILD ? { robots: { index: false, follow: false } } : {}),
    alternates: {
      languages: Object.fromEntries(AVAILABLE_LANGS.map((l) => [l, `/${l}`])),
    },
  }
}

/**
 * 이 레이아웃이 루트 레이아웃이다. `<html lang>` 이 로케일을 따라가야 하므로
 * `[lang]` 세그먼트 안에 두었다 (Next.js 의 i18n 라우팅 권장 구조).
 * `/` → `/ko` 리다이렉트는 `middleware.ts` 가 담당한다.
 */
export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang) || !AVAILABLE_LANGS.includes(lang)) notFound()

  const content = await getContent(lang)

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        pretendard.variable
      )}
    >
      <body>
        <ThemeProvider>
          <div className="flex min-h-svh flex-col">
            <NavBar
              lang={lang}
              items={content.nav}
              cta={content.navCta}
              companyName={content.company.nameEn}
              ui={content.ui}
            />
            <main className="flex-1">{children}</main>
            <Footer lang={lang} content={content} />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import "../globals.css"
import { fontMono, pretendard } from "../fonts"
import { Footer } from "@/components/nav/footer"
import { NavBar } from "@/components/nav/nav-bar"
import { ThemeProvider } from "@/components/theme-provider"
import { VisitBeacon } from "@/components/visit-beacon"
import { AVAILABLE_LANGS, isLang } from "@/content"
import { getContent } from "@/content/server"
import {
  JsonLd,
  defaultOgImage,
  organizationJsonLd,
  webSiteJsonLd,
} from "@/lib/seo"
import { IS_REVIEW_BUILD, SITE_URL } from "@/lib/site-env"
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
    // 이 값이 없으면 `/og/hadd-og.png` 같은 상대 경로가 절대 주소로 펴지지 않아
    // OG 이미지가 공유 카드에서 빈다(빌드 경고 후 localhost 로 대체된다).
    metadataBase: new URL(SITE_URL),
    title: {
      default: content.meta.title,
      template: `%s | ${content.company.nameEn}`,
    },
    description: content.meta.description,
    // 구글은 무시하지만 네이버는 아직 읽는다. 화면 카피에 실제로 있는 말만 적는다.
    keywords: content.meta.keywords,
    openGraph: {
      type: "website",
      title: content.meta.title,
      description: content.meta.description,
      siteName: content.company.nameEn,
      locale: lang === "ko" ? "ko_KR" : "en_US",
      images: [defaultOgImage(content)],
    },
    twitter: {
      card: "summary_large_image",
      title: content.meta.title,
      description: content.meta.description,
      images: [defaultOgImage(content).url],
    },
    /**
     * 소유확인 코드는 환경변수로만 받는다. 값이 없으면 `undefined` 가 그대로 넘어가
     * 태그 자체가 나가지 않는다 — 빈 문자열을 넣으면 `content=""` 인 태그가 붙어
     * 검증이 실패한다. 넣는 방법은 `docs/검색엔진-등록.md`.
     */
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      other: {
        ...(process.env.NAVER_SITE_VERIFICATION
          ? { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION }
          : {}),
      },
    },
    // 컨펌용 배포는 robots.txt 를 무시하는 크롤러까지 막기 위해 메타로도 한 번 더 막는다.
    ...(IS_REVIEW_BUILD ? { robots: { index: false, follow: false } } : {}),
    /**
     * canonical 과 hreflang 은 여기 두지 않는다. 레이아웃은 자기가 어느 경로에 얹혔는지
     * 모르므로 루트 주소밖에 적을 수 없고, 그러면 모든 하위 페이지가 첫 화면을
     * 자기 자신이라고 말하게 된다(2026-09-22 이전의 버그). 각 페이지가 `pageMetadata()` 로 낸다.
     */
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
          {/* 방문 집계. 공개 페이지에만 있다 — 관리 화면은 레이아웃이 따로라 세지 않는다 */}
          <VisitBeacon />
          {/*
            회사와 사이트를 구조화 데이터로 한 번 선언한다. 어느 페이지로 들어와도
            같은 `@id` 를 가리키므로, 기사·제품 구조화 데이터가 발행처·브랜드를
            다시 적지 않고 참조만 한다.
          */}
          <JsonLd data={organizationJsonLd(content, lang)} />
          <JsonLd data={webSiteJsonLd(content, lang)} />
        </ThemeProvider>
      </body>
    </html>
  )
}

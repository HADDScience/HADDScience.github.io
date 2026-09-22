import { createElement } from "react"

import type { Metadata } from "next"

import { AVAILABLE_LANGS, DEFAULT_LANG, type Lang, type SiteContent } from "@/content"
import { IS_REVIEW_BUILD, SITE_URL } from "@/lib/site-env"

/**
 * 검색엔진에 내보내는 메타데이터를 한 곳에 모은다.
 *
 * 흩어 두면 canonical 과 hreflang 이 페이지마다 어긋난다 — 2026-09-22 이전이 그랬다.
 * 레이아웃이 모든 페이지에 `/ko`·`/en` **루트**만 언어 짝으로 달아, 하위 페이지의
 * 언어 짝이 전부 틀린 곳을 가리켰다. 경로를 만드는 곳을 하나로 두면 그런 어긋남이
 * 생길 자리가 없어진다.
 */

/* ------------------------------------------------------------------ 경로 */

/**
 * 언어 접두사가 붙은 **사이트 경로**. `content/index.ts` 의 `localePath` 와 같은 규칙에
 * 끝 슬래시만 더한 것이다.
 *
 * 끝 슬래시를 붙이는 이유: `next.config.ts` 가 `trailingSlash: true` 라 실제로 서브되는
 * 주소가 `/ko/about/` 이다. canonical 이 `/ko/about` 이면 자기 자신이 아닌 주소를
 * 가리키게 되고, `sitemap.ts` 가 내는 주소와도 갈린다.
 */
export function sitePath(lang: Lang, path = "/"): string {
  const trimmed = path.replace(/\/+$/, "")
  return `/${lang}${trimmed === "" || trimmed === "/" ? "" : trimmed}/`
}

/** `SITE_URL` 기준 절대 주소. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/** 페이지 하나의 언어별 절대 주소. `path` 는 언어 접두사 **없는** 경로다. */
export function pageUrl(lang: Lang, path = "/"): string {
  return absoluteUrl(sitePath(lang, path))
}

/**
 * hreflang 짝. 페이지별로 만들어야 한다 — 루트만 가리키면 "이 글의 영어판"이 아니라
 * "영어판 첫 화면"을 알려 주는 셈이 된다.
 *
 * `x-default` 는 언어를 가리지 않는 방문자에게 줄 판이다. 한국 회사의 홈페이지이므로
 * 한국어를 기본으로 둔다.
 */
export function languageAlternates(path = "/"): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const lang of AVAILABLE_LANGS) languages[lang] = pageUrl(lang, path)
  languages["x-default"] = pageUrl(DEFAULT_LANG, path)
  return languages
}

/** og:locale 값. `ko` → `ko_KR`. */
const OG_LOCALE: Record<Lang, string> = { ko: "ko_KR", en: "en_US" }

/** JSON-LD 의 `inLanguage` 값. BCP 47. */
const BCP47: Record<Lang, string> = { ko: "ko-KR", en: "en-US" }

/* -------------------------------------------------------------- OG 이미지 */

export interface OgImage {
  url: string
  width?: number
  height?: number
  alt?: string
}

/** 공용 OG 이미지. 1200×630. 언어를 가리지 않는다(그림에 글자가 없다). */
export const DEFAULT_OG_IMAGE_PATH = "/og/hadd-og.png"

export function defaultOgImage(content: SiteContent): OgImage {
  return {
    url: DEFAULT_OG_IMAGE_PATH,
    width: 1200,
    height: 630,
    alt: content.meta.ogImageAlt,
  }
}

/* ---------------------------------------------------------------- 메타데이터 */

interface PageMetadataInput {
  lang: Lang
  content: SiteContent
  /** 언어 접두사 없는 경로. `/` · `/about` · `/news/20260827-1030` */
  path?: string
  /** 비우면 레이아웃의 기본 제목이 그대로 쓰인다. */
  title?: string
  description?: string
  /** 비우면 공용 OG 이미지. */
  images?: OgImage[]
  type?: "website" | "article"
  /** 기사면 발행 시각(ISO). `article:published_time` 으로 나간다. */
  publishedTime?: string
  /** 색인 지시를 따로 줄 때. 쪽나누기 2페이지 이후가 여기 걸린다. */
  robots?: Metadata["robots"]
}

/**
 * 페이지 하나의 canonical · hreflang · OG · 트위터 카드를 한 번에 만든다.
 *
 * `openGraph` · `twitter` 를 페이지마다 통째로 다시 적는 이유: Next 의 메타데이터 병합은
 * 최상위 키 단위라, 페이지가 `openGraph` 를 주면 레이아웃의 `openGraph` 가 통째로
 * 교체된다(siteName·locale 까지 사라진다). 그래서 여기서 매번 전부 채운다.
 */
export function pageMetadata({
  lang,
  content,
  path = "/",
  title,
  description,
  images,
  type = "website",
  publishedTime,
  robots,
}: PageMetadataInput): Metadata {
  const url = pageUrl(lang, path)
  const ogTitle = title ?? content.meta.title
  const ogDescription = description ?? content.meta.description
  const ogImages = images ?? [defaultOgImage(content)]

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type,
      url,
      title: ogTitle,
      description: ogDescription,
      siteName: content.company.nameEn,
      locale: OG_LOCALE[lang],
      images: ogImages,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ogImages.map((image) => image.url),
    },
    // 컨펌용 배포는 페이지가 무엇을 요구하든 전부 막는다 — 실도메인과 같은 내용이
    // 두 주소에서 색인되면 서로 경쟁한다.
    ...(IS_REVIEW_BUILD
      ? { robots: { index: false, follow: false } }
      : robots
        ? { robots }
        : {}),
  }
}

/* ------------------------------------------------------------------ JSON-LD */

/**
 * `<script type="application/ld+json">` 한 장.
 *
 * `</script`, `<!--` 처럼 HTML 파서를 빠져나가는 문자열이 데이터에 섞일 수 있어
 * `<` 를 유니코드 이스케이프로 바꾼다(JSON 안에서 값은 그대로다).
 *
 * JSX 가 아니라 `createElement` 로 만든 이유는 이 파일을 `.ts` 로 두기 위해서다 —
 * 메타데이터 헬퍼와 같은 파일에 있어야 경로 규칙이 갈리지 않는다.
 */
export function JsonLd({ data }: { data: object }) {
  return createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    },
  })
}

/** 다른 노드가 참조할 수 있도록 전역 식별자를 고정한다. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

/**
 * 회사. 구글이 회사명·로고·연락처를 사실로 읽는 근거다.
 * 값은 전부 `content.company` 에서 온다 — 두 곳에 적으면 한쪽만 고치게 된다.
 */
export function organizationJsonLd(content: SiteContent, lang: Lang) {
  const head = content.company.locations[0]
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: content.company.nameKo,
    alternateName: content.company.nameEn,
    url: pageUrl(lang, "/"),
    logo: absoluteUrl("/logo/logo-primary.png"),
    email: content.company.email,
    telephone: content.company.tel,
    ...(head
      ? {
          address: {
            "@type": "PostalAddress",
            // 주소를 시/구/도로명으로 쪼개 두지 않았다. 지어내지 않고 한 줄로 넣는다.
            streetAddress: head.address,
            addressCountry: "KR",
          },
        }
      : {}),
    // sameAs 는 공식 채널(링크드인·유튜브 등)이 정해지면 넣는다. 없는 것을 적지 않는다.
  }
}

/** 사이트. 검색 결과에서 회사 사이트로 묶이는 근거. */
export function webSiteJsonLd(content: SiteContent, lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: content.meta.title,
    url: pageUrl(lang, "/"),
    inLanguage: BCP47[lang],
    publisher: { "@id": ORGANIZATION_ID },
  }
}

export interface Crumb {
  name: string
  /** 언어 접두사 없는 경로. 마지막 항목은 비워도 된다(현재 페이지). */
  path?: string
}

/** 하위 페이지의 위치. 검색 결과에 경로가 함께 나온다. */
export function breadcrumbJsonLd(lang: Lang, content: SiteContent, crumbs: Crumb[]) {
  const all: Crumb[] = [{ name: content.company.nameEn, path: "/" }, ...crumbs]
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      ...(crumb.path ? { item: pageUrl(lang, crumb.path) } : {}),
    })),
  }
}

/**
 * `2026.08.27` → `2026-08-27`. 형식이 다르거나 달력에 없는 날이면 `undefined`.
 * 틀린 날짜를 구조화 데이터에 넣는 것은 날짜가 없는 것보다 나쁘다.
 */
export function isoDate(date: string): string | undefined {
  const m = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(date.trim())
  if (!m) return undefined
  const [, y, mo, d] = m
  const parsed = new Date(`${y}-${mo}-${d}T00:00:00+09:00`)
  if (Number.isNaN(parsed.getTime())) return undefined
  // 2026.02.31 처럼 넘치는 날은 Date 가 다음 달로 굴려 버린다. 되돌려 확인한다.
  const back = new Date(parsed.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10)
  return back === `${y}-${mo}-${d}` ? back : undefined
}

export function newsArticleJsonLd(input: {
  lang: Lang
  content: SiteContent
  /** 언어 접두사 없는 경로. `/news/20260827-1030` */
  path: string
  headline: string
  description?: string
  /** `isoDate()` 를 통과한 값만. 없으면 넣지 않는다. */
  datePublished?: string
  images?: string[]
}) {
  const url = pageUrl(input.lang, input.path)
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.images?.length
      ? { image: input.images.map((src) => (src.startsWith("http") ? src : absoluteUrl(src))) }
      : {}),
    inLanguage: BCP47[input.lang],
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
  }
}

/**
 * 제품. 가격·재고·평점은 **넣지 않는다** — 값을 모르고, 모르는 값을 지어내면
 * 구글이 구조화 데이터와 화면이 다르다고 판정한다.
 */
export function productJsonLd(input: {
  lang: Lang
  content: SiteContent
  path: string
  name: string
  description: string
  category?: string
  images?: string[]
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    ...(input.category ? { category: input.category } : {}),
    ...(input.images?.length
      ? { image: input.images.map((src) => (src.startsWith("http") ? src : absoluteUrl(src))) }
      : {}),
    url: pageUrl(input.lang, input.path),
    brand: { "@id": ORGANIZATION_ID },
    manufacturer: { "@id": ORGANIZATION_ID },
  }
}

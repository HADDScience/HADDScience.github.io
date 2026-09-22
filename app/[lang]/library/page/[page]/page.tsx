import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LibraryListPage, libraryTotalPages } from "@/components/ds/library-list"
import { AVAILABLE_LANGS, isLang } from "@/content"
import { getContent } from "@/content/server"
import { pageMetadata } from "@/lib/seo"

export async function generateStaticParams() {
  const params: { lang: string; page: string }[] = []
  for (const lang of AVAILABLE_LANGS) {
    const total = libraryTotalPages(await getContent(lang))
    // 1페이지는 /library 가 담당하므로 2페이지부터 만든다.
    for (let p = 2; p <= total; p++) params.push({ lang, page: String(p) })
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; page: string }>
}): Promise<Metadata> {
  const { lang, page } = await params
  if (!isLang(lang)) return {}
  const content = await getContent(lang)
  return pageMetadata({
    lang,
    content,
    // canonical 은 자기 페이지. 1페이지로 몰면 2페이지에만 있는 글이 색인에서 사라진다.
    path: `/library/page/${page}`,
    title: `${content.library.pageTitle} (${page})`,
    description: content.library.headline,
    // 뉴스 목록과 같은 판단이다 — 쪽나누기 페이지는 중복 문서가 되기 쉬우므로
    // 색인에서 빼고, 링크는 따라가게 둬 옛 글까지 크롤러가 닿게 한다.
    robots: { index: false, follow: true },
  })
}

export default async function LibraryPagedPage({
  params,
}: {
  params: Promise<{ lang: string; page: string }>
}) {
  const { lang, page } = await params
  if (!isLang(lang)) notFound()

  const content = await getContent(lang)
  const n = Number(page)
  if (!Number.isInteger(n) || n < 2 || n > libraryTotalPages(content)) notFound()

  return <LibraryListPage lang={lang} content={content} page={n} />
}

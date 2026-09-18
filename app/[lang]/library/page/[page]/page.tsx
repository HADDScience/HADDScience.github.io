import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LibraryListPage, libraryTotalPages } from "@/components/ds/library-list"
import { AVAILABLE_LANGS, isLang } from "@/content"
import { getContent } from "@/content/server"

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
  const c = await getContent(lang)
  return { title: `${c.library.pageTitle} (${page})` }
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

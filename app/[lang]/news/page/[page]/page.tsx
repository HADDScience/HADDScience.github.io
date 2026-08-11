import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { NewsListPage, newsTotalPages } from "@/components/ds/news-list"
import { AVAILABLE_LANGS, getContent, isLang } from "@/content"

export function generateStaticParams() {
  const params: { lang: string; page: string }[] = []
  for (const lang of AVAILABLE_LANGS) {
    const total = newsTotalPages(getContent(lang))
    // 1페이지는 /news 가 담당하므로 2페이지부터 생성한다.
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
  const c = getContent(lang)
  return { title: `${c.news.pageTitle} (${page})` }
}

export default async function NewsPagedPage({
  params,
}: {
  params: Promise<{ lang: string; page: string }>
}) {
  const { lang, page } = await params
  if (!isLang(lang)) notFound()

  const content = getContent(lang)
  const n = Number(page)
  if (!Number.isInteger(n) || n < 2 || n > newsTotalPages(content)) notFound()

  return <NewsListPage lang={lang} content={content} page={n} />
}

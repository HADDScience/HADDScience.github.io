import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { NewsListPage } from "@/components/ds/news-list"
import { getContent, isLang } from "@/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return { title: getContent(lang).news.pageTitle }
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return <NewsListPage lang={lang} content={getContent(lang)} page={1} />
}

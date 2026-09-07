import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { NewsListPage } from "@/components/ds/news-list"
import { isLang } from "@/content"
import { getContent } from "@/content/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return { title: (await getContent(lang)).news.pageTitle }
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return <NewsListPage lang={lang} content={await getContent(lang)} page={1} />
}

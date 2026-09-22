import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { NewsListPage } from "@/components/ds/news-list"
import { isLang } from "@/content"
import { getContent } from "@/content/server"
import { JsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  const content = await getContent(lang)
  return pageMetadata({
    lang,
    content,
    path: "/news",
    title: content.news.pageTitle,
    description: content.news.description,
  })
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const content = await getContent(lang)
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(lang, content, [
          { name: content.news.pageTitle, path: "/news" },
        ])}
      />
      <NewsListPage lang={lang} content={content} page={1} />
    </>
  )
}

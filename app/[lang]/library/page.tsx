import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LibraryListPage } from "@/components/ds/library-list"
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
    path: "/library",
    title: content.library.pageTitle,
    description: content.library.headline,
  })
}

export default async function LibraryPage({
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
          { name: content.library.pageTitle, path: "/library" },
        ])}
      />
      <LibraryListPage lang={lang} content={content} page={1} />
    </>
  )
}

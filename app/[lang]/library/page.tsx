import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LibraryListPage } from "@/components/ds/library-list"
import { isLang } from "@/content"
import { getContent } from "@/content/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return { title: (await getContent(lang)).library.pageTitle }
}

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return <LibraryListPage lang={lang} content={await getContent(lang)} page={1} />
}

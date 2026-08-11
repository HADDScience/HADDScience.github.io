import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ProductFamilyPage } from "@/components/ds/product-family"
import { getContent, isLang } from "@/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  const c = getContent(lang)
  return { title: "LiVEGEL", description: c.products[1].heading }
}

export default async function LiveGelPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return <ProductFamilyPage lang={lang} content={getContent(lang)} familyId="livegel" />
}

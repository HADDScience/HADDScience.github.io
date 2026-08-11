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
  return { title: "ADDGEL", description: c.products[0].heading }
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return <ProductFamilyPage lang={lang} content={getContent(lang)} familyId="addgel" />
}

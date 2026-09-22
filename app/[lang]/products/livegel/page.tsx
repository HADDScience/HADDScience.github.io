import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ProductFamilyPage } from "@/components/ds/product-family"
import { isLang } from "@/content"
import { getContent } from "@/content/server"
import { JsonLd, breadcrumbJsonLd, pageMetadata, productJsonLd } from "@/lib/seo"

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
    path: "/products/livegel",
    title: "LiVEGEL",
    description: content.products[1].heading,
  })
}

export default async function LiveGelPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const content = await getContent(lang)
  const livegel = content.products[1]

  return (
    <>
      {/* ADDGEL 과 같은 이유로 가격·재고는 넣지 않는다. */}
      <JsonLd
        data={productJsonLd({
          lang,
          content,
          path: "/products/livegel",
          name: livegel.name,
          description: livegel.description,
          category: livegel.eyebrow,
          images: livegel.variants.map((v) => v.image),
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(lang, content, [
          { name: content.productsPage.pageTitle, path: "/products" },
          { name: livegel.name, path: "/products/livegel" },
        ])}
      />
      <ProductFamilyPage lang={lang} content={content} familyId="livegel" />
    </>
  )
}

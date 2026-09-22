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
    path: "/products",
    title: "ADDGEL",
    description: content.products[0].heading,
  })
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const content = await getContent(lang)
  const addgel = content.products[0]

  return (
    <>
      {/*
        가격·재고·평점은 넣지 않는다. 연구용 시약이라 공개 가격이 없고, 모르는 값을
        채우면 구조화 데이터와 화면이 다르다고 판정된다.
      */}
      <JsonLd
        data={productJsonLd({
          lang,
          content,
          path: "/products",
          name: addgel.name,
          description: addgel.description,
          category: addgel.eyebrow,
          images: addgel.variants.map((v) => v.image),
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(lang, content, [
          { name: content.productsPage.pageTitle, path: "/products" },
        ])}
      />
      <ProductFamilyPage lang={lang} content={content} familyId="addgel" />
    </>
  )
}

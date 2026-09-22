import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/ds/page-header"
import { LegalDocument } from "@/components/ds/legal-doc"
import { Container, Section } from "@/components/ds/primitives"
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
    path: "/terms",
    title: content.footer.terms,
    description: content.legal.terms.intro,
  })
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const c = await getContent(lang)

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(lang, c, [
          { name: c.footer.terms, path: "/terms" },
        ])}
      />
      <PageHeader breadcrumb={c.legal.breadcrumb} title={c.footer.terms} />
      <Section>
        <Container narrow>
          <LegalDocument
            doc={c.legal.terms}
            effectiveLabel={c.legal.effectiveLabel}
          />
        </Container>
      </Section>
    </>
  )
}

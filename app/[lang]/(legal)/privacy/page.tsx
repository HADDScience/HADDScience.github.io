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
    path: "/privacy",
    title: content.footer.privacy,
    description: content.legal.privacy.intro,
  })
}

export default async function PrivacyPage({
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
          { name: c.footer.privacy, path: "/privacy" },
        ])}
      />
      <PageHeader breadcrumb={c.legal.breadcrumb} title={c.footer.privacy} />
      <Section>
        <Container narrow>
          <LegalDocument
            doc={c.legal.privacy}
            effectiveLabel={c.legal.effectiveLabel}
          />
        </Container>
      </Section>
    </>
  )
}

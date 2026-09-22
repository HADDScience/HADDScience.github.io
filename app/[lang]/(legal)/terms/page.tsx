import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/ds/page-header"
import { LegalDocument } from "@/components/ds/legal-doc"
import { Container, Section } from "@/components/ds/primitives"
import { isLang } from "@/content"
import { getContent } from "@/content/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return { title: (await getContent(lang)).footer.terms }
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

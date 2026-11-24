import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { JobBoard } from "@/components/ds/job-board"
import { PageHeader } from "@/components/ds/page-header"
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
    path: "/career",
    title: content.career.pageTitle,
    description: content.career.description,
  })
}

export default async function CareerPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const c = await getContent(lang)

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(lang, c, [{ name: c.career.pageTitle, path: "/career" }])} />
      <PageHeader
        breadcrumb={c.career.breadcrumb}
        title={c.career.headline}
        description={c.career.description}
      />
      <Section compact>
        <Container>
          <JobBoard lang={lang} career={c.career} />
        </Container>
      </Section>
    </>
  )
}

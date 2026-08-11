import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/ds/page-header"
import { Container, Section, SurfaceCard } from "@/components/ds/primitives"
import { getContent, isLang } from "@/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return { title: getContent(lang).footer.terms }
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const c = getContent(lang)

  return (
    <>
      <PageHeader breadcrumb={c.legal.breadcrumb} title={c.footer.terms} />
      <Section>
        <Container narrow>
          {/* 실제 약관 전문은 아임웹 사이트에 있다. 법무 확인을 거친 원문을 그대로 옮겨야 하므로
              여기서 문안을 창작하지 않는다. */}
          <SurfaceCard variant="flat" className="grid gap-3 p-8">
            <h2 className="text-xl font-bold">{c.legal.termsHeading}</h2>
            <p className="text-muted-foreground">{c.legal.termsBody}</p>
          </SurfaceCard>
        </Container>
      </Section>
    </>
  )
}

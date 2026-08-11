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
  return { title: getContent(lang).footer.privacy }
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  const c = getContent(lang)

  return (
    <>
      <PageHeader breadcrumb={c.legal.breadcrumb} title={c.footer.privacy} />
      <Section>
        <Container narrow>
          {/* 문의 폼이 개인정보를 수집하므로 공개 전에 반드시 채워야 하는 페이지다. */}
          <SurfaceCard variant="flat" className="grid gap-3 p-8">
            <h2 className="text-xl font-bold">{c.legal.privacyHeading}</h2>
            <p className="text-muted-foreground">{c.legal.privacyBody}</p>
          </SurfaceCard>
        </Container>
      </Section>
    </>
  )
}

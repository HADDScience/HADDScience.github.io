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
  return { title: getContent(lang).library.pageTitle }
}

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  const c = getContent(lang)
  const l = c.library

  return (
    <>
      <PageHeader
        breadcrumb={l.breadcrumb}
        title={l.headline}
        description={l.disclaimer}
      />

      <Section>
        <Container narrow>
          <div className="grid gap-4">
            {l.items.map((item) => (
              <SurfaceCard key={item.title} className="grid gap-3 p-6 md:p-8">
                <time className="text-muted-foreground font-mono text-xs">{item.date}</time>
                <h2 className="text-xl font-bold text-balance">{item.title}</h2>
                <p className="text-muted-foreground">{item.excerpt}</p>
              </SurfaceCard>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}

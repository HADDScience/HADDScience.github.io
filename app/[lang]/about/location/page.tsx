import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LocationCard } from "@/components/ds/cards"
import { PageHeader } from "@/components/ds/page-header"
import { Container, Section, SurfaceCard } from "@/components/ds/primitives"
import { getContent, isLang, localePath } from "@/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return { title: getContent(lang).location.pageTitle }
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  const c = getContent(lang)
  const path = (href: string) => localePath(lang, href)
  const subnav = c.nav[0].children ?? []

  return (
    <>
      <PageHeader
        breadcrumb={c.location.breadcrumb}
        title={c.location.pageTitle}
        links={subnav.map((s) => ({ ...s, href: path(s.href) }))}
        activeHref={path("/about/location")}
      />

      <Section>
        <Container>
          <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            {c.location.headline}
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {c.company.locations.map((loc) => (
              <LocationCard key={loc.kind} {...loc} />
            ))}
          </div>

          <SurfaceCard variant="flat" className="mt-6 grid gap-4 p-8 sm:grid-cols-2">
            <div className="grid gap-1">
              <p className="text-muted-foreground text-sm font-semibold">TEL</p>
              <p className="text-lg font-semibold">{c.company.tel}</p>
            </div>
            <div className="grid gap-1">
              <p className="text-muted-foreground text-sm font-semibold">FAX</p>
              <p className="text-lg font-semibold">{c.company.fax}</p>
            </div>
          </SurfaceCard>
        </Container>
      </Section>
    </>
  )
}

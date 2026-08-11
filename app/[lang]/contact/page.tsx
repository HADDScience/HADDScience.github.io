import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/ds/page-header"
import { Container, Section, SurfaceCard } from "@/components/ds/primitives"
import { ContactForm } from "@/components/forms/contact-form"
import { getContent, isLang } from "@/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return { title: getContent(lang).contact.pageTitle }
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  const c = getContent(lang)

  return (
    <>
      <PageHeader
        breadcrumb={c.contact.breadcrumb}
        title={c.contact.headline}
        description={c.contact.description}
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
            <ContactForm content={c} />

            <aside className="grid content-start gap-6">
              <SurfaceCard variant="tint" className="grid gap-4 p-6">
                <Row label="Working time" value={c.company.workingTime} />
                <Row
                  label="E-mail"
                  value={c.company.email}
                  href={`mailto:${c.company.email}`}
                />
                <Row label="TEL" value={c.company.tel} href={`tel:${c.company.tel.replace(/\s/g, "")}`} />
                <Row label="FAX" value={c.company.fax} />
              </SurfaceCard>

              <SurfaceCard className="grid gap-4 p-6">
                {c.company.locations.map((loc) => (
                  <div key={loc.kind} className="grid gap-1">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      {loc.kind}
                    </p>
                    <p className="text-sm">{loc.address}</p>
                  </div>
                ))}
              </SurfaceCard>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  )
}

function Row({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="grid gap-1">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </p>
      {href ? (
        <a
          href={href}
          className="text-primary text-sm font-semibold transition-colors duration-120 ease-[var(--ease-standard)] hover:text-brand-blue-500"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm font-semibold">{value}</p>
      )}
    </div>
  )
}

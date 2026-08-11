import Link from "next/link"

import { ProductCard } from "@/components/ds/cards"
import { FaqAccordion } from "@/components/ds/faq-accordion"
import { PageHeader } from "@/components/ds/page-header"
import { Container, Eyebrow, Section, SurfaceCard } from "@/components/ds/primitives"
import { Button } from "@/components/ui/button"
import { localePath, type Lang } from "@/content"
import type { SiteContent } from "@/content/types"

export function ProductFamilyPage({
  lang,
  content,
  familyId,
}: {
  lang: Lang
  content: SiteContent
  familyId: string
}) {
  const path = (href: string) => localePath(lang, href)
  const family = content.products.find((p) => p.id === familyId)
  if (!family) throw new Error(`Unknown product family: ${familyId}`)

  const p = content.productsPage
  const subnav = content.nav[1].children ?? []

  return (
    <>
      <PageHeader
        breadcrumb={p.breadcrumb}
        title={family.name}
        links={subnav.map((s) => ({ ...s, href: path(s.href) }))}
        activeHref={path(family.href)}
      />

      <Section>
        <Container>
          <div className="grid gap-4">
            <Eyebrow>{family.eyebrow}</Eyebrow>
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-balance md:text-4xl">
              {family.tagline}
            </h2>
            <p className="text-muted-foreground text-lg">{family.heading}</p>
          </div>

          <div
            className={
              family.variants.length > 1
                ? "mt-12 grid gap-6 md:grid-cols-3"
                : "mt-12 grid gap-6 md:max-w-md"
            }
          >
            {family.variants.map((variant) => (
              <ProductCard
                key={variant.id}
                variant={variant}
                description={family.description}
                regulatory={family.regulatory}
                href={path("/contact")}
                cta={variant.sampleRequest ? p.sampleCta : p.inquiryCta}
                ui={content.ui}
              />
            ))}
          </div>

          <p className="text-muted-foreground mt-6 text-sm">* {p.imageNote}</p>
        </Container>
      </Section>

      <Section tone="subtle">
        <Container narrow>
          <h2 className="text-2xl font-bold md:text-3xl">{p.faqTitle}</h2>
          <div className="mt-8">
            <FaqAccordion items={p.faq} />
          </div>
        </Container>
      </Section>

      <Section compact>
        <Container>
          <SurfaceCard
            variant="inverse"
            className="grid items-center gap-8 p-10 md:grid-cols-[1fr_auto] md:p-14"
          >
            <div className="grid gap-2">
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                {content.home.ctaBand.title}
              </h2>
              <p className="text-lg text-white/72">{content.home.ctaBand.description}</p>
            </div>
            <Button nativeButton={false} size="lg" className="text-brand-blue-900 bg-white hover:bg-white/88" render={<Link href={path("/contact")} />}>{content.home.ctaBand.cta}</Button>
          </SurfaceCard>
        </Container>
      </Section>
    </>
  )
}

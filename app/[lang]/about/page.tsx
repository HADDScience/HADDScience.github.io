import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { PageHeader } from "@/components/ds/page-header"
import {
  Container,
  FeatureItem,
  Section,
  SectionHeading,
  SurfaceCard,
} from "@/components/ds/primitives"
import { Button } from "@/components/ui/button"
import { getContent, isLang, localePath } from "@/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return { title: getContent(lang).about.pageTitle }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  const c = getContent(lang)
  const a = c.about
  const path = (href: string) => localePath(lang, href)
  const subnav = c.nav[0].children ?? []

  return (
    <>
      <PageHeader
        breadcrumb={a.breadcrumb}
        title={a.pageTitle}
        links={subnav.map((s) => ({ ...s, href: path(s.href) }))}
        activeHref={path("/about")}
      />

      <Section>
        <Container>
          <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
            <h2 className="text-brand-blue-700 text-3xl font-extrabold tracking-[-0.03em] text-balance md:text-4xl">
              {a.headline}
            </h2>
            <div className="grid content-start gap-2 text-lg">
              {a.lead.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="subtle" compact>
        <Container>
          <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
            <SectionHeading eyebrow="Story" title={a.story.title} className="max-w-xs" />
            <div className="grid content-start gap-3 text-lg">
              {a.story.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading eyebrow="What we do" title={a.whatWeDo.title} />
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {a.whatWeDo.items.map((item) => (
              <FeatureItem key={item.index} {...item} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="tint">
        <Container>
          <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <div className="grid gap-5">
              <SectionHeading eyebrow="Our team" title={a.team.title} />
              <p className="text-brand-blue-700 text-2xl font-bold text-balance md:text-3xl">
                “{a.team.quote}”
              </p>
            </div>
            <div className="md:justify-self-end">
              <Button nativeButton={false} size="lg" render={<Link href={path("/about/team")} />}>{a.team.cta}</Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading eyebrow="Collab & culture" title={a.culture.title} />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {a.culture.values.map((value, i) => (
              <SurfaceCard key={value} className="grid gap-4 p-8">
                <span className="text-brand-orange-500 font-mono text-sm font-bold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-xl font-semibold text-balance">{value}</p>
              </SurfaceCard>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="inverse" compact>
        <Container>
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div className="grid gap-2">
              <h2 className="text-2xl font-bold text-white md:text-3xl">{a.cta.title}</h2>
              <p className="text-lg text-white/72">{a.cta.description}</p>
            </div>
            <Button nativeButton={false} size="lg" className="text-brand-blue-900 bg-white hover:bg-white/88" render={<Link href={path("/products")} />}>{a.cta.label}</Button>
          </div>
        </Container>
      </Section>
    </>
  )
}

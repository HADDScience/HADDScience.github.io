import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TeamCard } from "@/components/ds/cards"
import { PageHeader } from "@/components/ds/page-header"
import { Container, Section } from "@/components/ds/primitives"
import { BlurFade } from "@/components/ui/blur-fade"
import { isLang, localePath } from "@/content"
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
    path: "/about/team",
    title: content.team.pageTitle,
    description: content.team.intro[0],
  })
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  const c = await getContent(lang)
  const t = c.team
  const path = (href: string) => localePath(lang, href)
  const subnav = c.nav[0].children ?? []

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(lang, c, [
          { name: c.about.pageTitle, path: "/about" },
          { name: t.pageTitle, path: "/about/team" },
        ])}
      />
      <PageHeader
        breadcrumb={t.breadcrumb}
        title={t.pageTitle}
        links={subnav.map((s) => ({ ...s, href: path(s.href) }))}
        activeHref={path("/about/team")}
      />

      <Section>
        <Container>
          <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-balance md:text-4xl">
              {t.headline.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <div className="grid content-start gap-3 text-lg text-muted-foreground">
              {t.intro.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {t.members.map((member, i) => (
              <BlurFade
                key={`${member.role}-${member.name}`}
                inView
                delay={i * 0.06}
                className="h-full"
              >
                <TeamCard member={member} />
              </BlurFade>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}

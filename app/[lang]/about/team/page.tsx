import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TeamCard } from "@/components/ds/cards"
import { PageHeader } from "@/components/ds/page-header"
import { Container, Section } from "@/components/ds/primitives"
import { getContent, isLang, localePath } from "@/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLang(lang)) return {}
  return { title: getContent(lang).team.pageTitle }
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  const c = getContent(lang)
  const t = c.team
  const path = (href: string) => localePath(lang, href)
  const subnav = c.nav[0].children ?? []

  return (
    <>
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
            <div className="text-muted-foreground grid content-start gap-3 text-lg">
              {t.intro.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {t.members.map((member) => (
              <TeamCard key={`${member.role}-${member.name}`} member={member} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}

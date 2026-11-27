import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { DeadlineCountdown, JobStatusBadge, WhenOpenOrInvited } from "@/components/ds/job-status"
import { PageHeader } from "@/components/ds/page-header"
import { PhotoCarousel } from "@/components/ds/photo-carousel"
import { Container, Section, SurfaceCard, Tag } from "@/components/ds/primitives"
import { ApplicationForm } from "@/components/forms/application-form"
import { Button } from "@/components/ui/button"
import { AVAILABLE_LANGS, isLang, localePath } from "@/content"
import { en } from "@/content/en"
import { ko } from "@/content/ko"
import { getContent } from "@/content/server"
import { renderedAt } from "@/lib/career-deadline"
import { JsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo"

/**
 * 공고는 코드에 있으므로 빌드 때 전부 굽는다. 없는 slug 는 아래 `notFound()` 가 404 로 보낸다.
 * `dynamicParams = false` 로 막지 않는 이유: 그러면 `next start` 가 404 마다 NoFallbackError 를
 * 로그에 찍는다(2026-11-24 실측). 다른 동적 경로(`news/[id]`)와 같은 방식을 쓴다.
 */
/**
 * 모집 상태는 브라우저가 시계로 다시 판단하지만(`components/ds/job-status.tsx`), 서버가 그린 HTML 도
 * 마감 근처에서 오래 남지 않게 5분마다 새로 그린다. 공고 페이지는 넷(ko·en × 목록·상세)뿐이라
 * 크롤러가 와도 재생성 횟수가 많지 않다.
 */
export const revalidate = 300

export function generateStaticParams() {
  const byLang = { ko, en }
  return AVAILABLE_LANGS.flatMap((lang) =>
    byLang[lang].career.jobs.map((job) => ({ lang, slug: job.slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang, slug } = await params
  if (!isLang(lang)) return {}
  const content = await getContent(lang)
  const job = content.career.jobs.find((j) => j.slug === slug)
  if (!job) return {}
  return pageMetadata({
    lang,
    content,
    path: `/career/${job.slug}`,
    title: job.title,
    description: job.summary,
  })
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  if (!isLang(lang)) notFound()
  const c = await getContent(lang)
  const job = c.career.jobs.find((j) => j.slug === slug)
  if (!job) notFound()

  const d = c.career.detail
  // 서버가 이 페이지를 그린 시각. 하이드레이션까지는 이 값으로 상태를 그린다.
  const serverNow = renderedAt()
  const period = { closesAt: job.closesAt }
  const closed = (
    <p className="rounded-lg bg-muted px-4 py-3 text-center font-bold text-muted-foreground">
      {d.closedNotice}
    </p>
  )

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(lang, c, [
          { name: c.career.pageTitle, path: "/career" },
          { name: job.title, path: `/career/${job.slug}` },
        ])}
      />
      <PageHeader breadcrumb={c.career.breadcrumb} title={job.title} description={job.summary} image="career" />

      <Section compact>
        <Container>
          <Link
            href={localePath(lang, "/career")}
            className="text-sm font-semibold text-primary transition-colors duration-120 ease-[var(--ease-standard)] hover:text-brand-blue-500"
          >
            {d.backToList}
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_340px] lg:gap-16">
            <article className="grid content-start gap-12">
              <div className="flex flex-wrap items-center gap-2">
                <JobStatusBadge
                  job={period}
                  serverNow={serverNow}
                  openLabel={c.career.list.open}
                  closedLabel={c.career.list.closed}
                  slug={job.slug}
                  invitedLabel={lang === "en" ? "Invited application" : "초대 지원"}
                />
                {job.tags.map((tag) => (
                  <Tag key={tag} tone="neutral">
                    {tag}
                  </Tag>
                ))}
              </div>

              {job.sections.slice(0, 1).map((section) => (
                <JobSection key={section.title} section={section} />
              ))}

              {/* 어떤 실습인지 읽은 바로 다음에 일하게 될 곳을 보여 준다. */}
              {job.photos?.length ? (
                <section className="grid gap-4">
                  <h2 className="text-2xl font-bold">{d.photosTitle}</h2>
                  <PhotoCarousel photos={job.photos} labels={d.carousel} />
                </section>
              ) : null}

              <section className="grid gap-4">
                <h2 className="text-2xl font-bold">{d.tracksTitle}</h2>
                <ol className="grid gap-3 sm:grid-cols-3">
                  {job.tracks.map((track, i) => (
                    <li key={track.value} className="grid content-start gap-2 border-t-2 border-primary pt-4">
                      <span className="font-mono text-sm font-bold text-brand-blue-500">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-semibold break-keep">{track.label}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-muted-foreground break-keep">{d.tracksNote}</p>
              </section>

              {job.sections.slice(1).map((section) => (
                <JobSection key={section.title} section={section} />
              ))}

              <section className="grid gap-4">
                <h2 className="text-2xl font-bold">{d.stepsTitle}</h2>
                <ol className="grid gap-3 sm:grid-cols-4">
                  {job.steps.map((step, i) => (
                    <li key={step.label} className="grid content-start gap-2 border-t-2 border-primary pt-4">
                      <span className="font-mono text-sm font-bold text-brand-blue-500">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-semibold break-keep">{step.label}</span>
                      {step.detail ? (
                        <span className="text-sm text-muted-foreground break-keep">{step.detail}</span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>

              <section className="grid gap-4">
                <h2 className="text-2xl font-bold">{d.notesTitle}</h2>
                <SurfaceCard variant="flat" className="p-6">
                  <ul className="grid gap-2 text-sm">
                    {job.notes.map((note) => (
                      <li key={note} className="flex gap-3 leading-[1.7] break-keep">
                        <span aria-hidden className="text-muted-foreground">
                          ·
                        </span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </SurfaceCard>
              </section>
            </article>

            {/* 모바일에서는 요약과 지원 버튼을 본문 위에 둔다 — 본문이 길어 아래에 두면 버튼을 찾기 어렵다. */}
            <aside className="order-first lg:order-none lg:sticky lg:top-28 lg:self-start">
              <SurfaceCard className="grid gap-5 p-6">
                <p className="text-[13px] font-bold tracking-[0.14em] text-brand-blue-500 uppercase">
                  {d.summaryTitle}
                </p>
                <dl className="grid gap-4">
                  <div className="grid gap-1">
                    <dt className="text-xs font-semibold text-muted-foreground">{d.periodTitle}</dt>
                    <dd className="text-sm font-semibold break-keep">{job.periodLabel}</dd>
                  </div>
                  {job.facts.map((fact) => (
                    <div key={fact.label} className="grid gap-1">
                      <dt className="text-xs font-semibold text-muted-foreground">{fact.label}</dt>
                      <dd className="text-sm font-semibold break-keep">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
                <DeadlineCountdown
                  job={period}
                  label={d.countdownLabel}
                  units={d.units}
                />
                <WhenOpenOrInvited job={period} slug={job.slug} serverNow={serverNow} fallback={closed}>
                  <Button nativeButton={false} size="lg" className="w-full" render={<a href="#apply" />}>
                    {d.applyCta}
                  </Button>
                </WhenOpenOrInvited>
              </SurfaceCard>
            </aside>
          </div>
        </Container>
      </Section>

      {/* 마감 뒤에도 유효한 개인 초대(?invite=)가 있으면 폼을 보인다 — lib/career-invite.ts */}
      <WhenOpenOrInvited job={period} slug={job.slug} serverNow={serverNow} fallback={null}>
        <Section tone="subtle" id="apply" className="scroll-mt-20">
          <Container narrow>
            <div className="grid gap-3">
              <h2 className="text-3xl font-bold">{c.career.form.title}</h2>
              <p className="text-muted-foreground">{c.career.form.description}</p>
            </div>
            <SurfaceCard className="mt-8 p-6 md:p-10">
              <ApplicationForm
                form={c.career.form}
                email={c.company.email}
                lang={lang}
                job={job}
                closedNotice={d.closedNotice}
              />
            </SurfaceCard>
          </Container>
        </Section>
      </WhenOpenOrInvited>
    </>
  )
}

function JobSection({
  section,
}: {
  section: { title: string; paragraphs?: string[]; list?: string[] }
}) {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-bold">{section.title}</h2>
      {section.paragraphs?.map((p) => (
        <p key={p} className="leading-[1.8] break-keep">
          {p}
        </p>
      ))}
      {section.list?.length ? (
        <ul className="grid gap-2">
          {section.list.map((item) => (
            <li key={item} className="flex gap-3 leading-[1.7] break-keep">
              <span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-brand-blue-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

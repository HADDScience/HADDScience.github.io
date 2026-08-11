import Image from "next/image"
import Link from "next/link"

import { NewsCard, ProductCard } from "@/components/ds/cards"
import { Hero } from "@/components/ds/hero"
import {
  Container,
  Eyebrow,
  Section,
  SectionHeading,
  StatBlock,
  SurfaceCard,
  Tag,
} from "@/components/ds/primitives"
import { Button } from "@/components/ui/button"
import { getContent, isLang, localePath } from "@/content"
import { cn } from "@/lib/utils"
import { notFound } from "next/navigation"

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLang(lang)) notFound()

  const c = getContent(lang)
  const path = (href: string) => localePath(lang, href)
  const [lead, ...restSlides] = c.home.heroSlides
  const addgel = c.products[0]

  return (
    <>
      <Hero
        title={lead.title}
        description={lead.description}
        cta={{ label: c.home.productSection.cta, href: path("/products") }}
        secondaryCta={{ label: c.navCta, href: path("/contact") }}
        priority
      />

      {/* 지표 밴드 */}
      <Section compact className="border-border border-b">
        <Container>
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            {c.home.stats.map((s) => (
              <StatBlock key={s.label} {...s} />
            ))}
          </div>
        </Container>
      </Section>

      {/*
        실제 사이트는 히어로 3장을 자동 캐러셀로 돌린다. 디자인시스템이
        auto-playing carousel 을 금지하므로 나머지 두 장면을 제품 소개 밴드로 편다.
      */}
      {restSlides.map((slide, i) => (
        <Section key={slide.title.join()} tone={i % 2 === 0 ? "subtle" : "page"}>
          <Container>
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div
                className={
                  i % 2 === 0 ? "grid gap-5" : "grid gap-5 md:order-2 md:justify-self-end"
                }
              >
                {slide.eyebrow ? <Eyebrow>{slide.eyebrow}</Eyebrow> : null}
                <h2 className="text-3xl font-bold text-balance md:text-4xl">
                  {slide.title.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </h2>
                <div className="text-muted-foreground grid gap-1 text-lg">
                  {slide.description.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                {slide.cta ? (
                  <div className="mt-2">
                    <Button nativeButton={false} size="lg" render={<Link href={path(slide.cta.href)} />}>{slide.cta.label}</Button>
                  </div>
                ) : null}
              </div>
              {slide.image ? (
                <div
                  className={cn(
                    "bg-surface-plate relative h-80 rounded-[24px]",
                    i % 2 !== 0 && "md:order-1"
                  )}
                >
                  <Image
                    src={slide.image}
                    alt={slide.eyebrow ?? ""}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-contain p-10"
                  />
                </div>
              ) : null}
            </div>
          </Container>
        </Section>
      ))}

      {/* 제품 */}
      <Section tone="tint">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow={c.home.productSection.eyebrow}
              title={c.home.productSection.title}
              description={c.home.productSection.heading}
            />
            <Button nativeButton={false} variant="outline" render={<Link href={path("/products")} />}>{c.home.productSection.cta}</Button>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {addgel.variants.map((v) => (
              <ProductCard
                key={v.id}
                variant={v}
                description={addgel.description}
                regulatory={addgel.regulatory}
                href={path(addgel.href)}
                cta={c.ui.viewDetail}
                ui={c.ui}
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* 회사 소개 */}
      <Section>
        <Container>
          <div className="grid gap-12 md:grid-cols-[1fr_1.3fr]">
            <SectionHeading
              eyebrow={c.home.aboutSection.eyebrow}
              title={c.home.aboutSection.title}
            />
            <div className="grid content-start gap-6">
              <div className="grid gap-3 text-lg">
                {c.home.aboutSection.body.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div>
                <Button nativeButton={false} variant="outline" render={<Link href={path("/about")} />}>{c.home.aboutSection.cta}</Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* 뉴스 */}
      <Section tone="subtle">
        <Container>
          <div className="grid gap-12 md:grid-cols-[1fr_1.6fr]">
            <SectionHeading
              eyebrow={c.home.newsSection.eyebrow}
              title={c.home.newsSection.title}
              description={c.home.newsSection.description}
              className="max-w-xs"
            />
            <div>
              <div className="border-border bg-card rounded-lg border px-6">
                {c.news.items.slice(0, 4).map((item) => (
                  <NewsCard key={item.id} item={item} lang={lang} layout="row" />
                ))}
              </div>
              <div className="mt-6">
                <Button nativeButton={false} variant="ghost" render={<Link href={path("/news")} />}>{c.home.newsSection.cta} <span aria-hidden>→</span></Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* 문의 CTA */}
      <Section compact>
        <Container>
          <SurfaceCard
            variant="inverse"
            className="grid items-center gap-10 p-10 md:grid-cols-[1fr_auto] md:p-16"
          >
            <div className="grid gap-3">
              <div>
                <Tag tone="inverse">{c.home.ctaBand.tag}</Tag>
              </div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                {c.home.ctaBand.title}
              </h2>
              <p className="max-w-xl text-lg text-white/72">{c.home.ctaBand.description}</p>
            </div>
            <Button nativeButton={false}
              size="lg"
              className="text-brand-blue-900 bg-white hover:bg-white/88" render={<Link href={path("/contact")} />}>{c.home.ctaBand.cta}</Button>
          </SurfaceCard>
        </Container>
      </Section>
    </>
  )
}

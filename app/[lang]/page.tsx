import Image from "next/image"
import Link from "next/link"

import { NewsCard, ProductCard } from "@/components/ds/cards"
import { PartnerMarquee } from "@/components/ds/partner-marquee"
import { ScrollStage } from "@/components/ds/scroll-stage"
import {
  Container,
  Eyebrow,
  Section,
  SectionHeading,
  StatBlock,
  SurfaceCard,
  Tag,
} from "@/components/ds/primitives"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { getContent, isLang, localePath } from "@/content"
import { partnersFor } from "@/content/partners"
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
  // 첫 슬라이드는 ScrollStage 의 히어로 패널이 쓰고, 나머지는 아래 제품 밴드가 쓴다.
  const [, ...restSlides] = c.home.heroSlides
  const addgel = c.products[0]

  return (
    <>
      {/*
        첫 화면: 배경(자사 활동 사진 콜라주)은 고정된 채 히어로 · 비전 · 제품 라인업
        세 패널이 위로 올라온다. 섹션이 끝나면 배경이 위로 밀려 올라가고 아래의
        주요 수치 밴드부터 일반 스크롤로 이어진다.
      */}
      <ScrollStage lang={lang} content={c} />

      {/* 지표 밴드 */}
      <Section compact className="border-b border-border">
        <Container>
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            {c.home.stats.map((s, i) => (
              <BlurFade key={s.label} inView delay={i * 0.08}>
                {/* 카운트업은 BlurFade 가 끝난 뒤 시작하도록 delay 를 맞춘다 */}
                <StatBlock {...s} delay={i * 0.08 + 0.2} />
              </BlurFade>
            ))}
          </div>
        </Container>
      </Section>

      {/*
        실제 사이트는 히어로 3장을 자동 캐러셀로 돌린다. 디자인시스템이
        auto-playing carousel 을 금지하므로 나머지 두 장면을 제품 소개 밴드로 편다.
      */}
      {restSlides.map((slide, i) => (
        <Section
          key={slide.title.join()}
          tone={i % 2 === 0 ? "subtle" : "page"}
        >
          <Container>
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div
                className={
                  i % 2 === 0
                    ? "grid gap-5"
                    : "grid gap-5 md:order-2 md:justify-self-end"
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
                <div className="grid gap-1 text-lg text-muted-foreground">
                  {slide.description.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                {slide.cta ? (
                  <div className="mt-2">
                    <Button
                      nativeButton={false}
                      size="lg"
                      render={<Link href={path(slide.cta.href)} />}
                    >
                      {slide.cta.label}
                    </Button>
                  </div>
                ) : null}
              </div>
              {slide.image ? (
                <div
                  className={cn(
                    "relative h-80 rounded-[24px] bg-surface-plate",
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
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={path("/products")} />}
            >
              {c.home.productSection.cta}
            </Button>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {addgel.variants.map((v, i) => (
              <BlurFade key={v.id} inView delay={i * 0.1} className="h-full">
                <ProductCard
                  variant={v}
                  description={addgel.description}
                  regulatory={addgel.regulatory}
                  href={path(addgel.href)}
                  cta={c.ui.viewDetail}
                  ui={c.ui}
                />
              </BlurFade>
            ))}
          </div>
        </Container>
      </Section>

      {/* 파트너 */}
      <PartnerMarquee
        eyebrow={c.home.partners.eyebrow}
        title={c.home.partners.title}
        description={c.home.partners.description}
        partners={partnersFor(lang)}
      />

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
                <Button
                  nativeButton={false}
                  variant="outline"
                  render={<Link href={path("/about")} />}
                >
                  {c.home.aboutSection.cta}
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* 뉴스 */}
      <Section>
        <Container>
          <div className="grid gap-12 md:grid-cols-[1fr_1.6fr]">
            <SectionHeading
              eyebrow={c.home.newsSection.eyebrow}
              title={c.home.newsSection.title}
              description={c.home.newsSection.description}
              className="max-w-xs"
            />
            <div>
              <div className="rounded-lg border border-border bg-card px-6">
                {c.news.items.slice(0, 4).map((item, i) => (
                  <BlurFade key={item.id} inView delay={i * 0.07}>
                    <NewsCard item={item} lang={lang} layout="row" />
                  </BlurFade>
                ))}
              </div>
              <div className="mt-6">
                <Button
                  nativeButton={false}
                  variant="ghost"
                  render={<Link href={path("/news")} />}
                >
                  {c.home.newsSection.cta} <span aria-hidden>→</span>
                </Button>
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
              <p className="max-w-xl text-lg text-white/72">
                {c.home.ctaBand.description}
              </p>
            </div>
            <Button
              nativeButton={false}
              size="lg"
              className="bg-white text-brand-blue-900 hover:bg-white/88"
              render={<Link href={path("/contact")} />}
            >
              {c.home.ctaBand.cta}
            </Button>
          </SurfaceCard>
        </Container>
      </Section>
    </>
  )
}

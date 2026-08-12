import Image from "next/image"
import Link from "next/link"

import { Container, Eyebrow, Tag } from "@/components/ds/primitives"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import type { Lang } from "@/content"
import { localePath } from "@/content"
import type { SiteContent } from "@/content/types"

/**
 * ScrollStage — 랜딩 첫 화면. 배경은 고정된 채 정보 패널만 위로 올라온다.
 *
 * 동작 원리
 *   섹션 높이를 300svh 로 두고 그 안에 `sticky top-0 h-svh` 배경을 깐다. 배경은
 *   섹션이 끝날 때까지 화면에 고정되고, 그 위로 100svh 짜리 패널 세 장이 흘러간다.
 *   섹션이 끝나면 배경이 자연스럽게 위로 밀려 올라가면서 다음 섹션(주요 수치)이
 *   나타난다 — 요청한 "이때는 배경이 올라가게" 가 이 지점이다.
 *
 *   JS 스크롤 계산 없이 CSS sticky 만으로 구현했다. 정적 배포에서 JS 가 늦게 붙어도
 *   레이아웃이 무너지지 않고, prefers-reduced-motion 에서도 고정 배경 자체는 문제가 없다.
 *   패널의 등장 애니메이션만 BlurFade(motion) 가 담당한다.
 *
 * 배경 사진에 대하여
 *   자사 활동 사진 6장을 합쳐 네이비 스크림을 씌운 콜라주다
 *   (scripts/build-hero-collage.mjs). 디자인시스템은 사진 배경을 금하지만 스톡이 아닌
 *   자사 기록이고 네이비 아래 텍스처로만 쓰이므로 히어로 한 곳에 한해 확장했다.
 */
export function ScrollStage({
  lang,
  content,
}: {
  lang: Lang
  content: SiteContent
}) {
  const path = (href: string) => localePath(lang, href)
  const hero = content.home.heroSlides[0]
  const { vision, lineup, scrollHint } = content.home.stage

  // 라인업 패널에 쓸 제품 — 제품 콘텐츠에서 가져와 중복 정의를 피한다.
  const products = content.products.flatMap((family) =>
    family.variants.map((v) => ({ ...v, familyId: family.id }))
  )

  return (
    // -mt-[77px]: 스티키 헤더는 투명해도 문서 흐름에서 자리를 그대로 차지한다.
    // 77px = h-19(76px) + border-b(1px). 76px 만 당기면 1px 흰 줄이 남는다. 그만큼
    // 끌어올려 배경이 화면 맨 위부터 채우게 한다. 스테이지 이후 콘텐츠도 76px 올라오는데,
    // 네비가 되살아나는 시점이 정확히 "스테이지 끝 = 헤더 아래" 라서 겹치지 않는다.
    <section id="scroll-stage" className="relative -mt-[77px] h-[300svh]">
      {/* 고정 배경 */}
      <div className="sticky top-0 h-svh overflow-hidden bg-brand-blue-900">
        {/*
          <picture> 를 쓰는 이유: next/image 두 개를 `hidden`/`sm:hidden` 으로 감추면
          숨긴 쪽도 함께 다운로드된다(측정: 데스크톱에서 세로판 76KB 낭비).
          source media 로 갈라야 브라우저가 한 장만 받는다. 정적 export 라
          `unoptimized: true` 이므로 next/image 를 써도 얻는 것이 없다.
        */}
        <picture>
          <source
            media="(max-width: 639px)"
            srcSet="/hero/collage-portrait.webp"
            width={1200}
            height={1600}
          />
          <img
            src="/hero/collage-wide.webp"
            alt=""
            width={2400}
            height={1350}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        {/*
          텍스트가 놓이는 좌측을 눌러 대비를 확보한다. 디자인시스템이 허용한 히어로
          그라디언트(120° navy)를 이 자리에 쓴다. 파란 색면으로 덮이지 않도록 알파를
          낮게 잡았고, 어둡게 만드는 일은 콜라주 자체의 밝기·블러가 담당한다.
        */}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(6,46,99,0.78)_0%,rgba(6,46,99,0.42)_55%,rgba(8,116,181,0.28)_100%)]" />
      </div>

      {/* 배경 위로 흐르는 패널 */}
      <div className="absolute inset-0 z-10">
        {/* 1 — 히어로 */}
        <StagePanel>
          <div className="grid max-w-[680px] gap-6">
            <BlurFade inView direction="up" offset={20}>
              <h1 className="text-4xl leading-[1.12] font-bold tracking-[-0.03em] text-balance text-white md:text-6xl">
                {hero.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h1>
            </BlurFade>
            <BlurFade inView direction="up" offset={20} delay={0.12}>
              <div className="grid gap-1 text-lg text-white/78 md:text-xl">
                {hero.description.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </BlurFade>
            <BlurFade inView direction="up" offset={20} delay={0.24}>
              <div className="mt-2 flex flex-wrap gap-3">
                <Button
                  nativeButton={false}
                  size="lg"
                  className="bg-white text-brand-blue-900 hover:bg-white/88"
                  render={<Link href={path("/products")} />}
                >
                  {content.home.productSection.cta}
                </Button>
                <Button
                  nativeButton={false}
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  render={<Link href={path("/contact")} />}
                >
                  {content.navCta}
                </Button>
              </div>
            </BlurFade>
          </div>

          {/* 스크롤 힌트 — 고정 배경이라 더 볼 게 있다는 신호가 필요하다 */}
          <div className="absolute bottom-10 left-6 flex items-center gap-3 md:left-8">
            <span className="text-[13px] font-bold tracking-[0.14em] text-white/50 uppercase">
              {scrollHint}
            </span>
            <span
              aria-hidden
              className="h-10 w-px bg-gradient-to-b from-white/50 to-transparent"
            />
          </div>
        </StagePanel>

        {/* 2 — 비전 */}
        <StagePanel>
          <div className="grid max-w-[760px] gap-6">
            <BlurFade inView direction="up" offset={20}>
              <Eyebrow tone="inverse">{vision.eyebrow}</Eyebrow>
            </BlurFade>
            <BlurFade inView direction="up" offset={24} delay={0.1}>
              <p className="text-4xl leading-[1.12] font-extrabold tracking-[-0.03em] text-balance text-white md:text-6xl">
                {vision.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </BlurFade>
            <BlurFade inView direction="up" offset={20} delay={0.22}>
              <div className="grid gap-2 text-lg text-white/72">
                {vision.body.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </BlurFade>
          </div>
        </StagePanel>

        {/* 3 — 제품 라인업 */}
        <StagePanel>
          <div className="grid w-full gap-10">
            <div className="grid max-w-[680px] gap-4">
              <BlurFade inView direction="up" offset={20}>
                <Eyebrow tone="inverse">{lineup.eyebrow}</Eyebrow>
              </BlurFade>
              <BlurFade inView direction="up" offset={22} delay={0.1}>
                <h2 className="text-3xl font-bold text-balance text-white md:text-4xl">
                  {lineup.title}
                </h2>
              </BlurFade>
              <BlurFade inView direction="up" offset={20} delay={0.18}>
                <p className="text-lg text-white/72">{lineup.description}</p>
              </BlurFade>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              {products.map((p, i) => (
                <BlurFade
                  key={p.id}
                  inView
                  direction="up"
                  offset={26}
                  delay={0.24 + i * 0.08}
                >
                  <figure className="grid gap-3">
                    {/*
                      투명 컷아웃이라 판을 깔지 않고 어두운 배경 위에 바로 띄운다.
                      유리·투명 캡이 배경에 묻히지 않도록 드롭섀도로 분리한다.
                    */}
                    <div className="relative h-32 md:h-44">
                      <Image
                        src={p.image}
                        alt={`${p.name} ${p.form}`}
                        fill
                        sizes="(min-width: 768px) 22vw, 45vw"
                        className="object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
                      />
                    </div>
                    <figcaption className="grid justify-items-start gap-1.5">
                      <span className="font-bold text-white">{p.name}</span>
                      <Tag tone="inverse">{p.form}</Tag>
                    </figcaption>
                  </figure>
                </BlurFade>
              ))}
            </div>
          </div>
        </StagePanel>
      </div>
    </section>
  )
}

/** 패널 하나 = 화면 한 장. 스티키 헤더(76px) 아래로 내용이 들어가지 않게 여백을 준다. */
function StagePanel({ children }: { children: React.ReactNode }) {
  return (
    // 스테이지 구간에는 네비가 없으므로 헤더 회피 여백을 두지 않고 화면 전체에 중앙 정렬한다.
    <div className="relative flex h-svh items-center">
      <Container>{children}</Container>
    </div>
  )
}

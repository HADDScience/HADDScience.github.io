import Image from "next/image"

import { Container, Eyebrow, Section } from "@/components/ds/primitives"
import { BlurFade } from "@/components/ui/blur-fade"
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from "@/components/ui/scroll-based-velocity"

interface Partner {
  id: string
  src: string
  width: number
  height: number
  name: string
}

/**
 * 파트너 로고 띠.
 *
 * 원본 사이트는 로고를 한 장으로 합쳐 격자로 보여준다. 여기서는 Magic UI 의
 * ScrollVelocity 로 두 줄을 서로 반대 방향으로 흘린다. 스크롤 속도에 따라 흐름이
 * 빨라지고 방향도 따라가므로, 스크롤이라는 사용자 행동에 반응하는 띠가 된다.
 *
 * **이 효과는 섹션이 페이지 중간에 있어야 성립한다.** 위아래로 스크롤할 여지가 있어야
 * 속도 변화가 보인다. 그래서 홈에서 파트너 섹션을 제품과 뉴스 사이에 둔다.
 *
 * 디자인시스템 관점의 판단 두 가지
 *
 * 1. 색. 로고 29개를 원색으로 깔면 색 예산(74% blue / 14% sky / 8% neutral /
 *    3% orange / 1% magenta)이 무너진다. 원본 사이트도 로고를 탈색해 쓴다.
 *    그래서 평상시 grayscale, hover 하면 원색으로 돌린다.
 * 2. 모션. 디자인시스템은 자동 재생 캐러셀을 금지하지만, 그 규칙의 취지는 읽어야 하는
 *    콘텐츠를 사용자 의사와 무관하게 넘기지 말라는 것이다. 이 띠는 개별 로고를 읽히려는
 *    장치가 아니고, 게다가 스크롤에 반응하므로 사용자 통제 아래 있다.
 *    prefers-reduced-motion 에서는 정지한다(globals.css base 레이어).
 */
export function PartnerMarquee({
  eyebrow,
  title,
  description,
  partners,
}: {
  eyebrow: string
  title: string
  description: string
  partners: Partner[]
}) {
  // 두 줄로 쪼갠다. 홀짝으로 나눠 줄마다 로고 폭이 고르게 섞이도록 한다.
  const rowA = partners.filter((_, i) => i % 2 === 0)
  const rowB = partners.filter((_, i) => i % 2 === 1)

  return (
    <Section tone="subtle" compact>
      <Container>
        <BlurFade inView>
          <div className="grid gap-4 text-center">
            <Eyebrow className="justify-self-center">{eyebrow}</Eyebrow>
            <h2 className="text-2xl font-bold text-balance md:text-3xl">
              {title}
            </h2>
            <p className="justify-self-center text-lg text-balance text-muted-foreground">
              {description}
            </p>
          </div>
        </BlurFade>
      </Container>

      {/*
        띠는 컨테이너 폭을 넘어 화면 끝까지 흐른다 (full-bleed).
        양끝은 mask 로 페이드해 잘린 로고가 아니라 "계속 이어진다"로 읽히게 한다.
      */}
      <ScrollVelocityContainer className="relative mt-12 [mask-image:linear-gradient(to_right,transparent,black_var(--fade),black_calc(100%-var(--fade)),transparent)] [--fade:6rem]">
        <ScrollVelocityRow baseVelocity={5} direction={1} className="py-3">
          <PartnerRow partners={rowA} />
        </ScrollVelocityRow>
        <ScrollVelocityRow baseVelocity={5} direction={-1} className="py-3">
          <PartnerRow partners={rowB} />
        </ScrollVelocityRow>
      </ScrollVelocityContainer>
    </Section>
  )
}

function PartnerRow({ partners }: { partners: Partner[] }) {
  return (
    <>
      {partners.map((p) => (
        <span
          key={p.id}
          className="inline-flex h-14 w-40 items-center justify-center align-middle sm:w-48"
        >
          <Image
            src={p.src}
            alt={p.name}
            width={p.width}
            height={p.height}
            // 정적 export 라 최적화가 없다. 원본이 이미 높이 120px 로 정규화돼 있다.
            className="max-h-7 w-auto max-w-full object-contain opacity-80 grayscale transition-all duration-200 ease-[var(--ease-standard)] hover:opacity-100 hover:grayscale-0 sm:max-h-8"
          />
        </span>
      ))}
    </>
  )
}

import Image from "next/image"

import { Container, Eyebrow, Section } from "@/components/ds/primitives"
import { Marquee } from "@/components/ui/marquee"

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
 * 원래 사이트는 로고를 격자로 나열한다. 여기서는 Magic UI Marquee 로 두 줄을 서로
 * 반대 방향으로 흘려보낸다. 로고가 31개라 격자로 깔면 홈이 로고 벽이 되어버리는데,
 * 띠로 만들면 높이를 반으로 줄이면서 "이만큼 많다"는 인상은 더 강해진다.
 *
 * 디자인시스템 관점의 판단 두 가지
 *
 * 1. 색. 로고 31개를 원색으로 깔면 디자인시스템의 색 예산
 *    (74% blue / 14% sky / 8% neutral / 3% orange / 1% magenta)이 무너진다.
 *    그래서 평상시에는 grayscale, hover 하면 원색으로 돌린다. 파트너 브랜드
 *    가이드라인이 회색조 사용을 금지하는 곳이 있으면 `grayscale` 만 빼면 된다.
 *
 * 2. 모션. 디자인시스템은 자동 재생 캐러셀을 금지하지만, 그 규칙의 취지는 읽어야 하는
 *    콘텐츠를 사용자 의사와 무관하게 넘기지 말라는 것이다. 이 띠는 개별 로고를 읽히려는
 *    장치가 아니므로 예외로 뒀다. 대신 hover 로 멈추고, prefers-reduced-motion 에서는
 *    정지한다(globals.css base 레이어).
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
        <div className="grid gap-4 text-center">
          <Eyebrow className="justify-self-center">{eyebrow}</Eyebrow>
          <h2 className="text-2xl font-bold text-balance md:text-3xl">{title}</h2>
          <p className="text-muted-foreground justify-self-center text-lg text-balance">
            {description}
          </p>
        </div>
      </Container>

      {/*
        띠는 컨테이너 폭을 넘어 화면 끝까지 흐른다 (full-bleed).
        양끝은 mask 로 페이드해 잘린 로고가 아니라 "계속 이어진다"로 읽히게 한다.
      */}
      <div className="relative mt-12 [--fade:6rem] [mask-image:linear-gradient(to_right,transparent,black_var(--fade),black_calc(100%-var(--fade)),transparent)]">
        <PartnerRow partners={rowA} duration="52s" />
        <PartnerRow partners={rowB} duration="64s" reverse />
      </div>
    </Section>
  )
}

function PartnerRow({
  partners,
  duration,
  reverse,
}: {
  partners: Partner[]
  duration: string
  reverse?: boolean
}) {
  return (
    <Marquee
      pauseOnHover
      reverse={reverse}
      // repeat 는 화면이 넓을 때 빈틈이 생기지 않도록 넉넉히 둔다.
      repeat={3}
      className="[--gap:3rem] py-3"
      style={{ ["--duration" as string]: duration }}
    >
      {partners.map((p) => (
        <div
          key={p.id}
          className="flex h-14 w-40 shrink-0 items-center justify-center sm:w-48"
        >
          <Image
            src={p.src}
            alt={p.name}
            width={p.width}
            height={p.height}
            // 정적 export 라 최적화가 없다. 원본이 이미 높이 120px 로 정규화돼 있다.
            className="max-h-7 w-auto max-w-full object-contain opacity-80 grayscale transition-all duration-200 ease-[var(--ease-standard)] hover:opacity-100 hover:grayscale-0 sm:max-h-8"
          />
        </div>
      ))}
    </Marquee>
  )
}

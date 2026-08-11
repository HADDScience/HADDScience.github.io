import Image from "next/image"
import Link from "next/link"
import * as React from "react"

import { Container, Eyebrow } from "@/components/ds/primitives"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Hero — 디자인시스템이 허용하는 유일한 그라디언트 (120° navy → blue).
 * 실제 사이트는 자동 재생 캐러셀로 3개 슬라이드를 돌리지만, 디자인시스템이
 * auto-playing carousel 을 금지하므로 세 장면을 세로로 쌓아 정적으로 배치했다.
 */
export function Hero({
  eyebrow,
  title,
  description,
  cta,
  secondaryCta,
  image,
  imageAlt,
  priority,
}: {
  eyebrow?: string
  title: string[]
  description: string[]
  cta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  image?: string
  imageAlt?: string
  priority?: boolean
}) {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(120deg,var(--brand-blue-900)_0%,var(--brand-blue-700)_62%,var(--brand-blue-600)_100%)] text-white">
      <Container
        className={cn(
          "grid items-center gap-12 py-20 md:py-30",
          image && "md:grid-cols-[1.05fr_0.95fr]"
        )}
      >
        <div className="grid max-w-[620px] gap-6">
          {eyebrow ? <Eyebrow tone="inverse">{eyebrow}</Eyebrow> : null}
          <h1 className="text-4xl leading-[1.12] font-bold tracking-[-0.03em] text-balance md:text-5xl">
            {title.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <div className="grid gap-1 text-lg text-white/78">
            {description.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          {(cta || secondaryCta) && (
            <div className="mt-2 flex flex-wrap gap-3">
              {cta ? (
                <Button nativeButton={false}
                  size="lg"
                  className="bg-white text-brand-blue-900 hover:bg-white/88" render={<Link href={cta.href} />}>{cta.label}</Button>
              ) : null}
              {secondaryCta ? (
                <Button nativeButton={false}
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white dark:bg-transparent dark:hover:bg-white/10" render={<Link href={secondaryCta.href} />}>{secondaryCta.label}</Button>
              ) : null}
            </div>
          )}
        </div>
        {image ? (
          // 투명 컷아웃을 navy 그라디언트 위에 올린다. 제품마다 비율이 달라 fill 을 쓴다.
          <div className="relative h-[380px]">
            <Image
              src={image}
              alt={imageAlt ?? ""}
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              priority={priority}
              className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.35)]"
            />
          </div>
        ) : null}
      </Container>
    </section>
  )
}

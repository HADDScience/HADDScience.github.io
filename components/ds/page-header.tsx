import Image from "next/image"
import Link from "next/link"
import * as React from "react"

import { Container } from "@/components/ds/primitives"

/**
 * 탭마다 깔리는 배경 그림. `public/headers/<이름>.webp`.
 *
 * 2026-11-24 Figma AI(gpt-image-2.5-flare)로 만들었다 — 남색 바탕에 반투명 유리 질감의 젤 방울·세포 구.
 * 레퍼런스는 토스 채용 페이지의 유리 질감 헤더와 핀터레스트의 남색 유리 렌더였다. 원본은 Figma 파일
 * 「HADD 홈페이지 헤더 그림 (2026-11-24)」에 있다. 그림은 왼쪽 절반을 비워 두고 오른쪽에 모티프를 둔다 —
 * 글이 왼쪽에 놓이기 때문이다. 새 그림도 이 구도를 지켜야 글이 읽힌다.
 */
export type HeaderImage =
  | "about"
  | "team"
  | "location"
  | "products"
  | "news"
  | "library"
  | "contact"
  | "career"
  | "legal"

/**
 * PageHeader — navy 밴드. Hero 와 달리 그라디언트를 쓰지 않는다
 * (디자인시스템은 그라디언트를 히어로 하나로 제한한다).
 *
 * `image` 를 주면 밴드 전체에 그림을 깔고 남색을 **단색으로** 겹친다. 그라디언트 겹침을 쓰지 않는 것도
 * 같은 규칙 때문이다. 모바일에서는 글이 그림의 모티프(오른쪽) 위까지 내려오므로 겹침을 진하게 한다.
 */
export function PageHeader({
  breadcrumb,
  title,
  description,
  links,
  activeHref,
  image,
}: {
  breadcrumb: string
  title: string
  description?: string
  links?: { label: string; href: string }[]
  activeHref?: string
  image?: HeaderImage
}) {
  return (
    <header className="relative isolate overflow-hidden bg-brand-blue-900 text-white">
      {image ? (
        <>
          {/* 꾸밈 그림이라 대체 텍스트를 비운다. 첫 화면에 보이므로 먼저 받는다. */}
          <Image
            src={`/headers/${image}.webp`}
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover object-right"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-brand-blue-900/60 md:bg-brand-blue-900/20" />
        </>
      ) : null}
      <Container className="py-14 md:py-20">
        <nav
          aria-label="breadcrumb"
          className="text-[13px] font-semibold tracking-[0.14em] text-brand-blue-300 uppercase"
        >
          {breadcrumb}
          <span aria-hidden className="mx-2 opacity-50">
            ›
          </span>
          <span className="tracking-normal text-white/70 normal-case">
            {title}
          </span>
        </nav>
        <h1 className="mt-4 text-3xl leading-[1.2] font-bold tracking-[-0.02em] break-keep text-balance md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg text-white/72">{description}</p>
        ) : null}
        {links?.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {links.map((l) => {
              const active = l.href === activeHref
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-blue-900"
                      : "rounded-full border border-white/28 px-4 py-2 text-sm font-medium text-white/80 transition-colors duration-120 ease-[var(--ease-standard)] hover:bg-white/10 hover:text-white"
                  }
                >
                  {l.label}
                </Link>
              )
            })}
          </div>
        ) : null}
      </Container>
    </header>
  )
}

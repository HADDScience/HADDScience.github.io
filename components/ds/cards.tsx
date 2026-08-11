import Image from "next/image"
import Link from "next/link"
import * as React from "react"

import { Badge, SurfaceCard, Tag } from "@/components/ds/primitives"
import { localePath, type Lang } from "@/content"
import type { NewsItem, ProductVariant, SiteContent, TeamMember } from "@/content/types"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------
 * ProductCard — 사진은 neutral-50 플레이트(24px 라디우스) 위에 올리고,
 * 카드 좌우 가장자리까지 흘러넘치지 않게 한다 (readme: Cards).
 * ---------------------------------------------------------------------- */
export function ProductCard({
  variant,
  description,
  regulatory,
  href,
  cta,
  ui,
}: {
  variant: ProductVariant
  description: string
  regulatory: string
  href: string
  cta: string
  ui: SiteContent["ui"]
}) {
  return (
    <SurfaceCard interactive className="group flex h-full flex-col p-5">
      {/* 제품 비율이 크게 달라(시린지 5.2:1, 바이알 0.42:1) fill + object-contain 으로
          판 안에 맞춘다. 에셋이 투명 컷아웃이라 blend mode 는 필요 없다.
          `w-auto` 로 두면 브라우저가 작은 srcset 후보를 고른 뒤 그 크기로 레이아웃이
          굳어 이미지가 축소된 채 남는다. */}
      <div className="bg-surface-plate relative h-52 rounded-[24px]">
        <Image
          src={variant.image}
          alt={`${variant.name} ${variant.form}`}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-6"
        />
      </div>
      <div className="grid flex-1 gap-3 pt-6">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold">{variant.name}</h3>
          <Tag>{variant.form}</Tag>
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
        <dl className="mt-1 grid gap-1 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-20 shrink-0">{ui.storage}</dt>
            <dd className="font-medium">{variant.storage}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-20 shrink-0">{ui.intendedUse}</dt>
            <dd className="font-medium">{regulatory}</dd>
          </div>
        </dl>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <Badge tone={variant.sampleRequest ? "success" : "neutral"}>
            {variant.sampleRequest ? ui.sampleAvailable : ui.sampleUnavailable}
          </Badge>
          <Link
            href={href}
            className="text-primary text-sm font-semibold transition-colors duration-120 ease-[var(--ease-standard)] group-hover:text-brand-blue-500"
          >
            {cta} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </SurfaceCard>
  )
}

/* -------------------------------------------------------------------------
 * NewsCard — card / row 두 레이아웃.
 * ---------------------------------------------------------------------- */
export function NewsCard({
  item,
  lang,
  layout = "card",
}: {
  item: NewsItem
  lang: Lang
  layout?: "card" | "row"
}) {
  // 카드뉴스를 이관한 글은 사이트 내부 상세 페이지로, 나머지는 아임웹 원문으로 보낸다.
  const external = item.href.startsWith("http")
  const href = external ? item.href : localePath(lang, item.href)
  const linkProps = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {}

  if (layout === "row") {
    return (
      <Link
        href={href}
        {...linkProps}
        className="group border-border flex items-center gap-5 border-b py-5 transition-colors duration-120 ease-[var(--ease-standard)] last:border-b-0"
      >
        <div className="bg-muted relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-[12px] sm:block">
          <Image src={item.image} alt="" fill sizes="112px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <time className="text-muted-foreground font-mono text-xs">{item.date}</time>
          <p className="group-hover:text-primary mt-1 line-clamp-2 font-semibold text-balance">
            {item.title}
          </p>
        </div>
        <span aria-hidden className="text-muted-foreground group-hover:text-primary">
          →
        </span>
      </Link>
    )
  }

  return (
    <SurfaceCard interactive className="overflow-hidden p-0">
      <Link href={href} {...linkProps} className="group block h-full">
        <div className="bg-muted relative aspect-[16/10] overflow-hidden">
          <Image
            src={item.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="grid gap-2 p-5">
          <time className="text-muted-foreground font-mono text-xs">{item.date}</time>
          <p className="group-hover:text-primary line-clamp-3 font-semibold text-balance">
            {item.title}
          </p>
        </div>
      </Link>
    </SurfaceCard>
  )
}

/* -------------------------------------------------------------------------
 * TeamCard — 사진 자산이 없으므로 이니셜 플레이트로 대체한다.
 * ---------------------------------------------------------------------- */
export function TeamCard({ member }: { member: TeamMember }) {
  return (
    <SurfaceCard className="grid gap-4 p-6">
      <div className="flex items-start gap-4">
        <span className="bg-brand-blue-50 text-brand-blue-700 flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold">
          {member.name.slice(0, 2)}
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {member.role}
          </p>
          <p className="text-lg font-bold">{member.name}</p>
        </div>
      </div>
      <p className="text-brand-blue-700 text-sm font-semibold">{member.specialty}</p>
      <p className="text-muted-foreground text-sm">{member.bio}</p>
    </SurfaceCard>
  )
}

/* -------------------------------------------------------------------------
 * LocationCard
 * ---------------------------------------------------------------------- */
export function LocationCard({
  kind,
  name,
  address,
  className,
}: {
  kind: string
  name: string
  address: string
  className?: string
}) {
  return (
    <SurfaceCard className={cn("grid gap-2 p-6", className)}>
      <Tag>{kind}</Tag>
      <p className="text-lg font-semibold">{name}</p>
      <p className="text-muted-foreground text-sm">{address}</p>
    </SurfaceCard>
  )
}

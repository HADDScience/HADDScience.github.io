import Image from "next/image"
import Link from "next/link"
import * as React from "react"

import { Badge, SurfaceCard, Tag } from "@/components/ds/primitives"
import { Lens } from "@/components/ui/lens"
import { MagicCard } from "@/components/ui/magic-card"
import { localePath, type Lang } from "@/content"
import type {
  NewsItem,
  ProductVariant,
  SiteContent,
  TeamMember,
} from "@/content/types"
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
  lens,
}: {
  variant: ProductVariant
  description: string
  regulatory: string
  href: string
  cta: string
  ui: SiteContent["ui"]
  /** 제품 페이지에서만 켠다. 라벨의 잔글씨를 확대해 볼 수 있게 한다. */
  lens?: boolean
}) {
  /* 제품 비율이 크게 달라(시린지 5.2:1, 바이알 0.42:1) fill + object-contain 으로
     판 안에 맞춘다. 에셋이 투명 컷아웃이라 blend mode 는 필요 없다.
     `w-auto` 로 두면 브라우저가 작은 srcset 후보를 고른 뒤 그 크기로 레이아웃이
     굳어 이미지가 축소된 채 남는다. */
  const image = (
    <div className="relative h-52 bg-surface-plate">
      <Image
        src={variant.image}
        alt={`${variant.name} ${variant.form}`}
        fill
        sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
        className="object-contain p-6"
      />
    </div>
  )

  return (
    // MagicCard 가 커서를 따라가는 그라디언트 테두리를 그린다. 색은 브랜드 블루 →
    // 오렌지. 라디우스는 rounded-[inherit] 로 상속받으므로 바깥에서 지정해야 한다.
    <MagicCard
      className="h-full rounded-lg shadow-ds-sm"
      gradientSize={260}
      gradientFrom="#0C4DA2"
      gradientTo="#F7941D"
      gradientColor="#EFF7FC"
      gradientOpacity={0.5}
    >
      <div className="group flex h-full flex-col p-5">
        <div className="overflow-hidden rounded-[24px]">
          {lens ? (
            <Lens zoomFactor={1.8} lensSize={150} lensColor="#0C4DA2">
              {image}
            </Lens>
          ) : (
            image
          )}
        </div>
        <div className="grid flex-1 gap-3 pt-6">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{variant.name}</h3>
            <Tag>{variant.form}</Tag>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          <dl className="mt-1 grid gap-1 text-sm">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-muted-foreground">
                {ui.storage}
              </dt>
              <dd className="font-medium">{variant.storage}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-muted-foreground">
                {ui.intendedUse}
              </dt>
              <dd className="font-medium">{regulatory}</dd>
            </div>
          </dl>
          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <Badge tone={variant.sampleRequest ? "success" : "neutral"}>
              {variant.sampleRequest
                ? ui.sampleAvailable
                : ui.sampleUnavailable}
            </Badge>
            <Link
              href={href}
              className="text-sm font-semibold text-primary transition-colors duration-120 ease-[var(--ease-standard)] group-hover:text-brand-blue-500"
            >
              {cta} <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </MagicCard>
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
        className="group flex items-center gap-5 border-b border-border py-5 transition-colors duration-120 ease-[var(--ease-standard)] last:border-b-0"
      >
        <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-[12px] bg-muted sm:block">
          <Image
            src={item.image}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <time className="font-mono text-xs text-muted-foreground">
            {item.date}
          </time>
          <p className="mt-1 line-clamp-2 font-semibold text-balance group-hover:text-primary">
            {item.title}
          </p>
        </div>
        <span
          aria-hidden
          className="text-muted-foreground group-hover:text-primary"
        >
          →
        </span>
      </Link>
    )
  }

  return (
    <SurfaceCard interactive className="overflow-hidden p-0">
      <Link href={href} {...linkProps} className="group block h-full">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={item.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="grid gap-2 p-5">
          <time className="font-mono text-xs text-muted-foreground">
            {item.date}
          </time>
          <p className="line-clamp-3 font-semibold text-balance group-hover:text-primary">
            {item.title}
          </p>
        </div>
      </Link>
    </SurfaceCard>
  )
}

/* -------------------------------------------------------------------------
 * TeamCard — haddscience.com/Team 의 인물 사진을 쓴다 (public/team/).
 * ---------------------------------------------------------------------- */
export function TeamCard({ member }: { member: TeamMember }) {
  return (
    <SurfaceCard
      interactive
      className="flex h-full flex-col overflow-hidden p-0"
    >
      {/*
        원본 사이트의 인물 사진은 증명사진이 아니라 각자의 무드를 담은 사진이다
        (대부분 뒷모습·풍경). 그래서 얼굴 크롭을 전제한 원형 아바타 대신 4:3 이미지를
        카드 상단에 그대로 얹는다.
      */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={member.photo}
          alt={`${member.name} — ${member.role}`}
          fill
          sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="grid flex-1 gap-3 p-6">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {member.role}
          </p>
          <p className="text-lg font-bold">{member.name}</p>
        </div>
        <p className="text-sm font-semibold text-brand-blue-700">
          {member.specialty}
        </p>
        <p className="text-sm text-muted-foreground">{member.bio}</p>
      </div>
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
      <p className="text-sm text-muted-foreground">{address}</p>
    </SurfaceCard>
  )
}

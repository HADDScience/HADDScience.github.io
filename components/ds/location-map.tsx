"use client"

import * as React from "react"

import { SurfaceCard, Tag } from "@/components/ds/primitives"
import type { OfficeLocation, SiteContent } from "@/content/types"
import { cn } from "@/lib/utils"

/**
 * LocationMap — 사업장 3곳을 탭으로 고르고 지도 하나를 바꿔 보여준다.
 *
 * 왜 지도를 하나만 두는가
 *   Google 지도 임베드는 iframe 하나당 Maps JS 를 통째로 내려받는다. 카드마다 지도를
 *   깔면 한 페이지에서 세 번 받는다. 선택식으로 두면 한 번이면 된다.
 *
 * 왜 API 키가 없는가
 *   `https://www.google.com/maps?q=...&output=embed` 는 키 없이 동작하는 임베드다.
 *   정적 배포(GitHub Pages / Synology Web Station)에는 서버가 없어 키를 숨길 곳도
 *   없으므로 이 방식이 맞다. 카카오맵으로 바꾸려면 JS 키를 발급받아 도메인을 등록해야
 *   하는데, 그때는 이 컴포넌트만 교체하면 된다.
 *
 * 길찾기는 카카오·네이버·Google 로 내보낸다. 국내 사용자는 카카오·네이버를 더 쓴다.
 */
export function LocationMap({
  locations,
  labels,
}: {
  locations: OfficeLocation[]
  labels: SiteContent["location"]
}) {
  const [active, setActive] = React.useState(0)
  const current = locations[active]

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
      <div className="grid content-start gap-3">
        {locations.map((loc, i) => (
          <button
            key={loc.kind}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={cn(
              "grid gap-2 rounded-lg border p-5 text-left transition-all duration-200 ease-[var(--ease-standard)]",
              i === active
                ? "border-primary bg-brand-blue-50 shadow-ds-sm"
                : "border-border bg-card hover:border-input"
            )}
          >
            <Tag tone={i === active ? "brand" : "neutral"}>{loc.kind}</Tag>
            <span className="font-semibold">{loc.name}</span>
            <span className="text-sm text-muted-foreground">{loc.address}</span>
          </button>
        ))}
      </div>

      <SurfaceCard className="overflow-hidden p-0">
        <div className="relative aspect-[4/3] bg-muted sm:aspect-[16/10]">
          <iframe
            // key 를 붙여 선택이 바뀔 때 iframe 을 다시 만든다.
            // src 만 갈아끼우면 사용자가 지도를 움직인 상태가 히스토리에 쌓인다.
            key={current.mapQuery}
            title={`${current.kind} — ${current.name}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(current.mapQuery)}&output=embed&hl=ko`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5">
          <p className="text-sm text-muted-foreground">{labels.mapNote}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {labels.directions}
            </span>
            {labels.mapProviders.map((provider) => (
              <a
                key={provider.id}
                href={directionsUrl(provider.id, current.mapQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold transition-colors duration-120 ease-[var(--ease-standard)] hover:border-primary hover:text-primary"
              >
                {provider.label}
              </a>
            ))}
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}

function directionsUrl(provider: "google" | "kakao" | "naver", query: string) {
  const q = encodeURIComponent(query)
  switch (provider) {
    case "kakao":
      return `https://map.kakao.com/link/search/${q}`
    case "naver":
      return `https://map.naver.com/p/search/${q}`
    default:
      return `https://www.google.com/maps/search/?api=1&query=${q}`
  }
}

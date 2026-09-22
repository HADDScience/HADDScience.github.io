"use client"

import { Loader2, RefreshCw } from "lucide-react"
import * as React from "react"

import { MiniBars } from "@/components/admin/mini-bars"
import { StatTile } from "@/components/admin/stat-tile"
import type { Post } from "@/content/types"
import { ApiError } from "@/lib/admin-api"
import type { ApiConfig } from "@/lib/admin-config"
import {
  loadStats,
  STATS_DAYS,
  type StatsDays,
  type VisitStats,
} from "@/lib/admin-stats"
import { cn } from "@/lib/utils"

/**
 * 사이트 방문 통계.
 *
 * 숫자는 Omnis 가 집계해서 준다(`GET /api/website/stats`). 이 화면은 그리기만 한다 —
 * 집계를 여기서 다시 하면 두 곳이 어긋난다.
 *
 * **경로 대신 글 제목으로 보여 준다.** `/ko/news/170271833` 만 늘어놓으면 어느 글이
 * 읽혔는지 알 수 없는데, 관리 화면은 기사 목록을 이미 받아 두었으므로 여기서 이어 붙인다.
 */

/* -------------------------------------------------- 경로를 사람 말로 */

const ROUTES: Record<string, string> = {
  "": "홈",
  about: "회사소개",
  "about/team": "팀",
  "about/location": "찾아오시는 길",
  products: "제품",
  "products/livegel": "라이브젤",
  news: "뉴스 목록",
  library: "하드:라이브러리 목록",
  contact: "문의",
  privacy: "개인정보처리방침",
  terms: "이용약관",
}

/** `/ko/news/170271833` → `{ label: "모더나, 독감백신까지…", lang: "KO" }` */
function describe(path: string, titles: Map<string, string>) {
  const parts = path.replace(/^\/+|\/+$/g, "").split("/")
  const lang = parts[0] === "en" ? "EN" : "KO"
  const rest = parts.slice(1).join("/")

  // 쪽나누기(`news/page/3`)를 먼저 본다. 글 주소와 모양이 같아서, 나중에 보면
  // 3 이라는 id 의 글을 찾다가 못 찾고 "page/3" 을 제목 자리에 그대로 내건다.
  const paged = /^(news|library)\/page\/(\d+)$/.exec(rest)
  if (paged)
    return { label: `${ROUTES[paged[1]]} ${paged[2]}쪽`, lang, kind: null }

  const article = /^(news|library)\/(.+)$/.exec(rest)
  if (article) {
    const kind = article[1] === "library" ? "라이브러리" : "뉴스"
    // 제목을 못 찾으면 id 라도 보여 준다 — 지운 글이 통계에는 남아 있을 수 있다
    return { label: titles.get(article[2]) ?? article[2], lang, kind }
  }

  return { label: ROUTES[rest] ?? `/${rest}`, lang, kind: null }
}

/* -------------------------------------------------- 화면 */

export function SiteStats({ cfg, posts }: { cfg: ApiConfig; posts: Post[] }) {
  const [days, setDays] = React.useState<StatsDays>(30)
  const [data, setData] = React.useState<VisitStats | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const titles = React.useMemo(
    () =>
      new Map(
        posts.map(
          (p) => [p.id, p.content[p.sourceLang]?.title || p.id] as const
        )
      ),
    [posts]
  )

  const load = React.useCallback(
    async (d: StatsDays) => {
      setBusy(true)
      try {
        setData(await loadStats(cfg, d))
        setError(null)
      } catch (err) {
        // 통계 경로가 아직 배포되지 않은 상태와 진짜 오류를 구분해 준다 — 둘의 대처가 다르다.
        setError(
          err instanceof ApiError && err.status === 404
            ? "통계를 받을 준비가 아직 안 됐습니다 (Omnis 에 배포되면 보입니다)."
            : err instanceof Error
              ? err.message
              : "통계를 불러오지 못했습니다"
        )
      } finally {
        setBusy(false)
      }
    },
    [cfg]
  )

  React.useEffect(() => {
    void Promise.resolve().then(() => load(days))
  }, [load, days])

  return (
    <section
      aria-label="사이트 통계"
      className="mb-4 grid min-w-0 gap-5 rounded-lg border border-border bg-card p-5"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="mr-1 text-xs font-semibold text-muted-foreground">
          사이트 방문
        </p>
        {STATS_DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            aria-pressed={days === d}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors duration-120 ease-[var(--ease-standard)]",
              days === d
                ? "border-brand-blue-700 bg-brand-blue-700 text-white"
                : "border-border hover:border-brand-blue-500"
            )}
          >
            {d}일
          </button>
        ))}
        {busy ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        ) : null}
        <button
          type="button"
          onClick={() => void load(days)}
          title="새로고침"
          className="ml-auto grid size-7 place-items-center rounded-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      {error ? (
        <p className="rounded-[12px] bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          {error}
        </p>
      ) : !data ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data.totals.views ? (
        <p className="rounded-[12px] bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          아직 기록이 없습니다. 방문 집계는 켠 날부터 쌓이고, 지난 방문은 복원할
          수 없습니다.
        </p>
      ) : (
        <Body data={data} titles={titles} />
      )}
    </section>
  )
}

function Body({
  data,
  titles,
}: {
  data: VisitStats
  titles: Map<string, string>
}) {
  const mobile = data.devices.find((d) => d.device === "mobile")?.views ?? 0
  const mobilePct = data.totals.views
    ? Math.round((mobile / data.totals.views) * 100)
    : 0
  // 방문자 하나가 몇 쪽을 보는가. 1.0 이면 한 쪽만 보고 나간다는 뜻이다.
  const perVisitor = data.totals.visitors
    ? (data.totals.views / data.totals.visitors).toFixed(1)
    : "0"

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          value={String(data.today.visitors)}
          unit="명"
          label="오늘 방문자"
          note={`조회 ${data.today.views}회`}
        />
        <StatTile
          value={String(data.totals.visitors)}
          unit="명"
          label={`${data.days}일 방문자`}
          note={`${data.from} ~ ${data.to}`}
        />
        <StatTile
          value={String(data.totals.views)}
          unit="회"
          label={`${data.days}일 조회`}
          note={`1명당 ${perVisitor}쪽`}
        />
        <StatTile
          value={String(mobilePct)}
          unit="%"
          label="모바일"
          note={`${mobile}회 / 전체 ${data.totals.views}회`}
        />
      </div>

      <figure className="min-w-0">
        <figcaption className="mb-2 text-xs font-semibold text-muted-foreground">
          일별 방문자
        </figcaption>
        <MiniBars
          barClassName="max-w-6"
          bars={data.daily.map((d, i) => ({
            key: d.date,
            // 날짜를 다 적으면 붙어서 안 읽힌다. 기간에 따라 눈금 간격을 벌린다.
            label:
              i % Math.ceil(data.daily.length / 6) === 0 ||
              i === data.daily.length - 1
                ? d.date.slice(5).replace("-", ".")
                : "",
            value: d.visitors,
            tooltip: `${d.date} · 방문자 ${d.visitors}명 · 조회 ${d.views}회`,
            sr: `${d.date} 방문자 ${d.visitors}명, 조회 ${d.views}회`,
          }))}
        />
      </figure>

      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <List
          title="많이 본 페이지"
          empty="아직 없습니다"
          rows={data.topPaths.map((p) => {
            const d = describe(p.path, titles)
            return {
              key: p.path,
              label: d.label,
              meta: [d.lang, d.kind].filter(Boolean).join(" · "),
              value: `${p.views}회`,
              sub: `${p.visitors}명`,
            }
          })}
        />
        <List
          title="유입 경로"
          empty="직접 들어온 방문뿐입니다"
          rows={data.referrers.map((r) => ({
            key: r.host,
            label: r.host,
            meta: "",
            value: `${r.views}회`,
            sub: "",
          }))}
        />
      </div>
    </>
  )
}

function List({
  title,
  empty,
  rows,
}: {
  title: string
  empty: string
  rows: {
    key: string
    label: string
    meta: string
    value: string
    sub: string
  }[]
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">
        {title}
      </p>
      {!rows.length ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="grid min-w-0 gap-1">
          {rows.map((r) => (
            <li
              key={r.key}
              className="flex min-w-0 items-baseline gap-3 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">
                {r.label}
                {r.meta ? (
                  <span className="ml-2 text-[11px] text-muted-foreground">
                    {r.meta}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 tabular-nums">{r.value}</span>
              {r.sub ? (
                <span className="w-12 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                  {r.sub}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

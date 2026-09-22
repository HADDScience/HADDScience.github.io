import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { NewsListPage, newsTotalPages } from "@/components/ds/news-list"
import { AVAILABLE_LANGS, isLang } from "@/content"
import { getContent } from "@/content/server"
import { pageMetadata } from "@/lib/seo"

export async function generateStaticParams() {
  const params: { lang: string; page: string }[] = []
  for (const lang of AVAILABLE_LANGS) {
    const total = newsTotalPages(await getContent(lang))
    // 1페이지는 /news 가 담당하므로 2페이지부터 생성한다.
    for (let p = 2; p <= total; p++) params.push({ lang, page: String(p) })
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; page: string }>
}): Promise<Metadata> {
  const { lang, page } = await params
  if (!isLang(lang)) return {}
  const content = await getContent(lang)
  return pageMetadata({
    lang,
    content,
    // canonical 은 1페이지가 아니라 **자기 페이지**를 가리킨다. 1페이지로 몰면
    // 2페이지에만 있는 기사가 "다른 곳에 있는 글"로 취급돼 크롤링에서 밀린다.
    path: `/news/page/${page}`,
    title: `${content.news.pageTitle} (${page})`,
    description: content.news.description,
    /**
     * 목록 2페이지 이후는 색인하지 않고 링크만 따라가게 둔다. 내용이 기사 카드의
     * 반복이라 1페이지·기사 상세와 거의 같은 문서로 경쟁하고, 글이 늘면 같은 기사가
     * 다음 날 다른 페이지로 밀려 색인이 계속 흔들린다. `follow` 는 켜 둬야
     * 크롤러가 이 페이지를 통해 옛 기사까지 닿는다.
     */
    robots: { index: false, follow: true },
  })
}

export default async function NewsPagedPage({
  params,
}: {
  params: Promise<{ lang: string; page: string }>
}) {
  const { lang, page } = await params
  if (!isLang(lang)) notFound()

  const content = await getContent(lang)
  const n = Number(page)
  if (!Number.isInteger(n) || n < 2 || n > newsTotalPages(content)) notFound()

  return <NewsListPage lang={lang} content={content} page={n} />
}

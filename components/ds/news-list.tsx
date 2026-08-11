import { NewsCard } from "@/components/ds/cards"
import { PageHeader } from "@/components/ds/page-header"
import { Pagination } from "@/components/ds/pagination"
import { Container, Section } from "@/components/ds/primitives"
import { localePath, type Lang } from "@/content"
import type { SiteContent } from "@/content/types"

export const NEWS_PER_PAGE = 12

export function newsTotalPages(content: SiteContent) {
  return Math.max(1, Math.ceil(content.news.items.length / NEWS_PER_PAGE))
}

/**
 * 뉴스 목록. 정적 export 에서는 `?page=` 를 읽을 수 없으므로 페이지마다 라우트를 만든다.
 * 1페이지는 `/news`, 2페이지 이후는 `/news/page/2`.
 */
export function NewsListPage({
  lang,
  content,
  page,
}: {
  lang: Lang
  content: SiteContent
  page: number
}) {
  const totalPages = newsTotalPages(content)
  const items = content.news.items.slice(
    (page - 1) * NEWS_PER_PAGE,
    page * NEWS_PER_PAGE
  )

  return (
    <>
      <PageHeader
        breadcrumb={content.news.breadcrumb}
        title={content.news.headline}
        description={content.news.description}
      />

      <Section>
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <NewsCard key={item.id} item={item} lang={lang} />
            ))}
          </div>

          <div className="mt-16">
            <Pagination
              page={page}
              totalPages={totalPages}
              labels={content.ui}
              hrefFor={(p) =>
                p === 1
                  ? localePath(lang, "/news")
                  : localePath(lang, `/news/page/${p}`)
              }
            />
          </div>
        </Container>
      </Section>
    </>
  )
}

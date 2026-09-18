import { NewsCard } from "@/components/ds/cards"
import { PageHeader } from "@/components/ds/page-header"
import { Pagination } from "@/components/ds/pagination"
import { Container, Section } from "@/components/ds/primitives"
import { BlurFade } from "@/components/ui/blur-fade"
import { localePath, type Lang } from "@/content"
import type { SiteContent } from "@/content/types"

export const LIBRARY_PER_PAGE = 12

export function libraryTotalPages(content: SiteContent) {
  return Math.max(1, Math.ceil(content.library.items.length / LIBRARY_PER_PAGE))
}

/**
 * 하드:라이브러리 목록. 뉴스와 같은 카드·쪽나누기를 쓴다 — 2026-09-18 에 아임웹에 있던
 * 글 103건을 옮겨 오면서 사진과 상세 페이지가 생겼고, 그 뒤로는 뉴스와 같은 화면이다.
 * 1페이지는 `/library`, 2페이지 이후는 `/library/page/2`.
 */
export function LibraryListPage({
  lang,
  content,
  page,
}: {
  lang: Lang
  content: SiteContent
  page: number
}) {
  const totalPages = libraryTotalPages(content)
  const items = content.library.items.slice(
    (page - 1) * LIBRARY_PER_PAGE,
    page * LIBRARY_PER_PAGE
  )

  return (
    <>
      <PageHeader
        breadcrumb={content.library.breadcrumb}
        title={content.library.headline}
        description={content.library.disclaimer}
      />

      <Section>
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <BlurFade key={item.id} inView delay={i * 0.06}>
                <NewsCard item={item} lang={lang} />
              </BlurFade>
            ))}
          </div>

          <div className="mt-16">
            <Pagination
              page={page}
              totalPages={totalPages}
              labels={content.ui}
              hrefFor={(p) =>
                p === 1
                  ? localePath(lang, "/library")
                  : localePath(lang, `/library/page/${p}`)
              }
            />
          </div>
        </Container>
      </Section>
    </>
  )
}

/**
 * 하드:라이브러리 글 상세. 뉴스 상세와 같은 렌더(PostBody)를 쓰고, 이전·다음 글만
 * 라이브러리 안에서 찾는다 - getArticleNeighbors 가 같은 목록만 본다.
 * 영문은 글자만 번역되어 있고 이미지는 원문을 그대로 쓴다(그림에 한글이 없다).
 */
import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { PageHeader } from "@/components/ds/page-header"
import { PostBody } from "@/components/ds/post-body"
import { Container, Section } from "@/components/ds/primitives"
import { Button } from "@/components/ui/button"
import { AVAILABLE_LANGS, isLang, localePath } from "@/content"
import {
  externalArticleHref,
  getArticleNeighbors,
  getContent,
  getPost,
  getPostLocale,
  hasArticle,
  listLibrary,
} from "@/content/server"
import {
  JsonLd,
  breadcrumbJsonLd,
  isoDate,
  newsArticleJsonLd,
  pageMetadata,
} from "@/lib/seo"

export async function generateStaticParams() {
  const params: { lang: string; id: string }[] = []
  const posts = await listLibrary()
  for (const lang of AVAILABLE_LANGS) {
    for (const post of posts) {
      // 본문 블록이 있는 글만 페이지를 갖는다. 옮겨 온 라이브러리 글은 모두 본문이 있다.
      if (hasArticle(post, lang)) params.push({ lang, id: post.id })
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}): Promise<Metadata> {
  const { lang, id } = await params
  if (!isLang(lang)) return {}
  const post = await getPost(id)
  if (!post) return {}
  const locale = getPostLocale(post, lang)
  if (!locale) return {}
  const image = locale.thumbnail || post.thumbnail
  const published = isoDate(post.date)
  return pageMetadata({
    lang,
    content: await getContent(lang),
    path: `/library/${post.id}`,
    title: locale.title,
    description: locale.summary || undefined,
    type: "article",
    ...(published ? { publishedTime: published } : {}),
    ...(image ? { images: [{ url: image, alt: locale.title }] } : {}),
  })
}

export default async function LibraryDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang, id } = await params
  if (!isLang(lang)) notFound()

  const content = await getContent(lang)
  const post = await getPost(id)
  // 뉴스 글 주소로는 열리지 않게 한다(같은 표를 쓴다).
  if (!post || post.category !== "library") notFound()

  const locale = getPostLocale(post, lang)
  // 아직 옮기지 않은 글은 사이트 안에 본문이 없다. 도메인이 넘어오면서 옛 아임웹 주소가
  // 이리로 들어오므로(next.config 의 redirects) 404 대신 원문으로 보낸다. 남은 글을 다
  // 옮기면 이 갈래는 저절로 사라진다.
  const originalHref = post.externalHref ? externalArticleHref(post.externalHref) : null
  if (!locale?.blocks.length) {
    if (originalHref) redirect(originalHref)
    notFound()
  }

  const { prev, next } = await getArticleNeighbors(post.id, lang)
  const path = (href: string) => localePath(lang, href)

  const image = locale.thumbnail || post.thumbnail

  return (
    <>
      {/* 뉴스와 같은 글 모델이라 같은 구조화 데이터를 쓴다. 경로만 라이브러리다. */}
      <JsonLd
        data={newsArticleJsonLd({
          lang,
          content,
          path: `/library/${post.id}`,
          headline: locale.title,
          description: locale.summary || undefined,
          datePublished: isoDate(post.date),
          images: image ? [image] : undefined,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(lang, content, [
          { name: content.library.pageTitle, path: "/library" },
          { name: locale.title, path: `/library/${post.id}` },
        ])}
      />
      <PageHeader breadcrumb={content.library.breadcrumb} title={locale.title} />

      <Section>
        <Container narrow>
          <time
            dateTime={post.date.replaceAll(".", "-")}
            className="font-mono text-sm text-muted-foreground"
          >
            {post.date}
          </time>

          {locale.summary ? (
            <p className="mt-4 text-lg text-balance text-muted-foreground">
              {locale.summary}
            </p>
          ) : null}

          <article>
            <PostBody blocks={locale.blocks} />
          </article>

          {/* 아임웹 원문이 남아 있는 글은 출처를 함께 남긴다. */}
          {originalHref ? (
            <p className="mt-8 text-sm text-muted-foreground">
              <a
                href={originalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-primary"
              >
                {content.news.readOriginal} <span aria-hidden>↗</span>
              </a>
            </p>
          ) : null}

          {/* 이전 · 다음 글 */}
          {prev || next ? (
            <nav
              aria-label={content.news.pageTitle}
              className="mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
            >
              {prev ? (
                <Link
                  href={path(`/library/${prev.id}`)}
                  className="group grid gap-1 rounded-lg border border-border p-5 transition-colors duration-120 ease-[var(--ease-standard)] hover:border-brand-blue-500"
                >
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <span aria-hidden>←</span> {content.news.prevPost}
                  </span>
                  <span className="line-clamp-2 font-semibold text-balance group-hover:text-primary">
                    {getPostLocale(prev, lang)?.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={path(`/library/${next.id}`)}
                  className="group grid gap-1 rounded-lg border border-border p-5 text-right transition-colors duration-120 ease-[var(--ease-standard)] hover:border-brand-blue-500 sm:col-start-2"
                >
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {content.news.nextPost} <span aria-hidden>→</span>
                  </span>
                  <span className="line-clamp-2 font-semibold text-balance group-hover:text-primary">
                    {getPostLocale(next, lang)?.title}
                  </span>
                </Link>
              ) : null}
            </nav>
          ) : null}

          <div className="mt-12">
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={path("/library")} />}
            >
              <span aria-hidden>←</span> {content.news.backToList}
            </Button>
          </div>
        </Container>
      </Section>
    </>
  )
}

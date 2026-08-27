import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/ds/page-header"
import { PostBody } from "@/components/ds/post-body"
import { Container, Section } from "@/components/ds/primitives"
import { Button } from "@/components/ui/button"
import { AVAILABLE_LANGS, isLang, localePath } from "@/content"
import {
  getArticleNeighbors,
  getContent,
  getPost,
  getPostLocale,
  hasArticle,
  listPosts,
} from "@/content/server"

export function generateStaticParams() {
  const params: { lang: string; id: string }[] = []
  for (const lang of AVAILABLE_LANGS) {
    for (const post of listPosts()) {
      // 본문 블록이 있는 글만 사이트 안에 페이지를 갖는다. 나머지는 목록 카드가
      // 아임웹 원문으로 직접 보낸다.
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
  const post = getPost(id)
  if (!post) return {}
  const locale = getPostLocale(post, lang)
  if (!locale) return {}
  return {
    title: locale.title,
    description: locale.summary || undefined,
    openGraph: {
      type: "article",
      title: locale.title,
      description: locale.summary || undefined,
      images: [post.thumbnail],
    },
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang, id } = await params
  if (!isLang(lang)) notFound()

  const content = getContent(lang)
  const post = getPost(id)
  if (!post) notFound()

  const locale = getPostLocale(post, lang)
  if (!locale?.blocks.length) notFound()

  const { prev, next } = getArticleNeighbors(post.id, lang)
  const path = (href: string) => localePath(lang, href)

  return (
    <>
      <PageHeader breadcrumb={content.news.breadcrumb} title={locale.title} />

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
          {post.externalHref ? (
            <p className="mt-8 text-sm text-muted-foreground">
              <a
                href={post.externalHref}
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
                  href={path(`/news/${prev.id}`)}
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
                  href={path(`/news/${next.id}`)}
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
              render={<Link href={path("/news")} />}
            >
              <span aria-hidden>←</span> {content.news.backToList}
            </Button>
          </div>
        </Container>
      </Section>
    </>
  )
}

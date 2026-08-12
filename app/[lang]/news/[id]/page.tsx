import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/ds/page-header"
import { Container, Section } from "@/components/ds/primitives"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import { AVAILABLE_LANGS, getContent, isLang, localePath } from "@/content"

export function generateStaticParams() {
  const params: { lang: string; id: string }[] = []
  for (const lang of AVAILABLE_LANGS) {
    for (const item of getContent(lang).news.items) {
      if (item.cards?.length) params.push({ lang, id: item.id })
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
  const item = getContent(lang).news.items.find((n) => n.id === id)
  if (!item) return {}
  return {
    title: item.title,
    openGraph: { title: item.title, images: [item.image] },
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
  const item = content.news.items.find((n) => n.id === id)
  if (!item?.cards?.length) notFound()

  return (
    <>
      <PageHeader breadcrumb={content.news.breadcrumb} title={item.title} />

      <Section>
        <Container narrow>
          <time className="font-mono text-sm text-muted-foreground">
            {item.date}
          </time>

          {/*
            아임웹 원문의 본문은 텍스트 없이 1024×1024 카드뉴스 이미지로만 이루어져 있다.
            그대로 옮기되 alt 에 최소한 제목과 순번을 넣어 스크린리더가 맥락을 잡게 한다.
            본문 텍스트가 생기면 이 자리에 넣을 것.
          */}
          <div className="mt-8 grid gap-4">
            {item.cards.map((src, i) => (
              <BlurFade key={src} inView delay={Math.min(i, 3) * 0.08}>
                <Image
                  src={src}
                  alt={`${item.title} — ${i + 1}/${item.cards!.length}`}
                  width={1080}
                  height={1080}
                  sizes="(min-width: 840px) 840px, 100vw"
                  priority={i === 0}
                  className="h-auto w-full rounded-lg bg-muted"
                />
              </BlurFade>
            ))}
          </div>

          <div className="mt-12">
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={localePath(lang, "/news")} />}
            >
              <span aria-hidden>←</span> {content.news.pageTitle}
            </Button>
          </div>
        </Container>
      </Section>
    </>
  )
}

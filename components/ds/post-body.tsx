import Image from "next/image"

import { LiveCard } from "@/components/cardnews/live-card"
import { BlurFade } from "@/components/ui/blur-fade"
import type { CardDeck, PostBlock } from "@/content/types"

/**
 * 기사 본문 렌더러.
 *
 * 블록 배열 하나로 카드뉴스(이미지만)와 앞으로 쓸 글(텍스트 중심)을 모두 그린다.
 * 관리자 페이지의 에디터도 이 블록 배열을 그대로 만들어 내므로, 여기가 미리보기와
 * 실제 페이지의 공통 출력부가 된다 — 두 벌로 나뉘면 반드시 어긋난다.
 *
 * `prose` 같은 타이포그래피 플러그인을 쓰지 않는 이유: 디자인시스템이 본문 크기 ·
 * 행간 · 여백을 이미 정해 두었고, 플러그인 기본값이 그것을 덮어쓴다.
 */
export function PostBody({
  blocks,
  resolveSrc,
  deck,
}: {
  blocks: PostBlock[]
  /**
   * 이미지 경로를 실제로 불러올 주소로 바꾼다. 관리자 미리보기에서 아직 커밋하지
   * 않은 이미지를 blob: URL 로 보여주기 위한 것으로, 사이트에서는 쓰지 않는다.
   */
  resolveSrc?: (src: string) => string
  /**
   * 카드뉴스 원본. 주면 k 번째 이미지 블록 자리에 k 번째 카드를 **HTML 로** 그린다 —
   * 구운 이미지로는 카드 안의 글을 검색엔진도 스크린리더도 읽지 못한다(2026-09-28).
   *
   * 이미지 블록 수가 카드 수와 같을 때만 쓴다. 저장된 글 35건 전부 그렇다 — 카드
   * 이미지는 덱을 구운 결과라 순서대로 1:1 이고, 링크 같은 다른 블록은 그 사이가 아니라
   * 끝에 붙는다. 수가 다르면(편집 도중 어긋났거나 사진을 따로 끼운 글) 엉뚱한 카드를
   * 보여 주느니 구운 이미지를 그대로 쓴다.
   */
  deck?: CardDeck
}) {
  // alt 가 비어 있을 때 쓸 "n/총장수" 를 미리 계산한다. 렌더 중 카운터를 증가시키면
  // 리렌더에서 값이 어긋난다(react-hooks/immutability).
  const imageOrdinals = new Map<number, number>()
  blocks.forEach((b, i) => {
    if (b.type === "image") imageOrdinals.set(i, imageOrdinals.size + 1)
  })
  const imageTotal = imageOrdinals.size
  const cards = deck && deck.cards.length === imageTotal ? deck : undefined

  return (
    <div className="mt-8 grid gap-6">
      {blocks.map((block, i) => {
        const delay = Math.min(i, 4) * 0.07

        switch (block.type) {
          case "heading":
            return (
              <BlurFade key={i} inView delay={delay}>
                <h2 className="mt-6 text-2xl font-bold tracking-[-0.02em] text-balance md:text-3xl">
                  {block.text}
                </h2>
              </BlurFade>
            )

          case "text":
            return (
              <BlurFade key={i} inView delay={delay}>
                <p className="text-lg leading-[1.75] whitespace-pre-line">
                  {block.text}
                </p>
              </BlurFade>
            )

          case "quote":
            return (
              <BlurFade key={i} inView delay={delay}>
                <blockquote className="border-l-4 border-brand-blue-500 py-1 pl-6">
                  <p className="text-lg font-semibold text-balance">
                    {block.text}
                  </p>
                  {block.cite ? (
                    <cite className="mt-2 block text-sm font-normal text-muted-foreground not-italic">
                      — {block.cite}
                    </cite>
                  ) : null}
                </blockquote>
              </BlurFade>
            )

          case "links":
            return (
              <BlurFade key={i} inView delay={delay}>
                <section className="rounded-lg border border-border bg-muted/40 p-5">
                  <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    {block.title}
                  </h2>
                  <ul className="mt-3 grid gap-2">
                    {block.items.map((it, k) => (
                      <li key={k}>
                        <a
                          href={it.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-medium text-brand-blue-600 underline-offset-4 hover:underline"
                        >
                          {it.label} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              </BlurFade>
            )

          case "image": {
            const ordinal = imageOrdinals.get(i) ?? 0
            if (cards) {
              // BlurFade 로 감싸지 않는다. BlurFade 는 서버 HTML 을 opacity:0 으로 내보내고
              // 자바스크립트가 붙어야 드러내는데, 이 카드는 글자를 읽히게 하려고 그리는 것이다.
              // JS 를 끈 첫 화면에서 본문이 통째로 비었다(2026-09-28 실측).
              return (
                <LiveCard
                  key={i}
                  card={cards.cards[ordinal - 1]}
                  deck={cards}
                  label={`카드 ${ordinal}/${imageTotal}`}
                />
              )
            }
            /* 카드뉴스는 1024×1024 정사각이지만 앞으로 올릴 사진은 비율이 제각각이다.
               고정 width/height 로 CLS 를 막되 h-auto 로 실제 비율을 따르게 한다. */
            const alt = block.alt || `본문 이미지 ${ordinal}/${imageTotal}`
            return (
              <BlurFade key={i} inView delay={delay}>
                <figure className="grid gap-2">
                  <Image
                    src={resolveSrc ? resolveSrc(block.src) : block.src}
                    alt={alt}
                    width={1080}
                    height={1080}
                    sizes="(min-width: 840px) 840px, 100vw"
                    priority={i === 0}
                    className="h-auto w-full rounded-lg bg-muted"
                  />
                  {block.caption ? (
                    <figcaption className="text-sm text-muted-foreground">
                      {block.caption}
                    </figcaption>
                  ) : null}
                </figure>
              </BlurFade>
            )
          }
        }
      })}
    </div>
  )
}

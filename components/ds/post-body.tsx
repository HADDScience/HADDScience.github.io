import Image from "next/image"

import { BlurFade } from "@/components/ui/blur-fade"
import type { PostBlock } from "@/content/types"

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
}: {
  blocks: PostBlock[]
  /**
   * 이미지 경로를 실제로 불러올 주소로 바꾼다. 관리자 미리보기에서 아직 커밋하지
   * 않은 이미지를 blob: URL 로 보여주기 위한 것으로, 사이트에서는 쓰지 않는다.
   */
  resolveSrc?: (src: string) => string
}) {
  // alt 가 비어 있을 때 쓸 "n/총장수" 를 미리 계산한다. 렌더 중 카운터를 증가시키면
  // 리렌더에서 값이 어긋난다(react-hooks/immutability).
  const imageOrdinals = new Map<number, number>()
  blocks.forEach((b, i) => {
    if (b.type === "image") imageOrdinals.set(i, imageOrdinals.size + 1)
  })
  const imageTotal = imageOrdinals.size

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

          case "image": {
            /* 카드뉴스는 1024×1024 정사각이지만 앞으로 올릴 사진은 비율이 제각각이다.
               고정 width/height 로 CLS 를 막되 h-auto 로 실제 비율을 따르게 한다. */
            const alt =
              block.alt || `본문 이미지 ${imageOrdinals.get(i)}/${imageTotal}`
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

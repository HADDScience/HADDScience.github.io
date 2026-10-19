import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  type ParagraphChild,
} from "docx"

import type { PostBlock } from "@/content/types"
import { DRAFT_LABEL, type Draft } from "@/lib/admin-column"

/**
 * 칼럼 초안을 워드 파일(.docx)로 굽는다 — 대표님께 메일·카톡으로 보내는 검토본.
 *
 * 브라우저에서 만든다. 사진은 `/omnis/api/website/media/…` 로 같은 오리진에서 오므로(rewrite)
 * 그대로 받아 캔버스에서 PNG 로 바꾼다 — 워드는 webp 를 넣지 못한다.
 * 본문의 [1] 같은 근거 번호는 지우지 않는다. 검토본이라 끝에 붙는 「근거 기사」 목록과 맞춰 볼 수 있어야 한다.
 */

const FONT = "맑은 고딕"
const GREY = "6E6E6E"
/** A4 본문 폭(여백 2.54cm 양쪽)에 맞춘 사진 최대 폭, px(96dpi). */
const MAX_IMAGE_PX = 600

const run = (text: string, o: { bold?: boolean; size?: number; color?: string; italics?: boolean } = {}) =>
  new TextRun({ text, font: FONT, size: o.size ?? 22, bold: o.bold, color: o.color, italics: o.italics })

/** 줄바꿈을 워드 줄바꿈으로. 본문 블록은 줄바꿈을 그대로 보여 준다(사이트와 같게). */
function lines(text: string, o?: Parameters<typeof run>[1]): TextRun[] {
  return text.split("\n").map((line, i) =>
    new TextRun({ text: line, font: FONT, size: o?.size ?? 22, bold: o?.bold, color: o?.color, italics: o?.italics, break: i ? 1 : 0 })
  )
}

async function toPng(src: string): Promise<{ data: Uint8Array; width: number; height: number }> {
  const res = await fetch(src)
  if (!res.ok) throw new Error(`사진을 받지 못했습니다 (${res.status}): ${src}`)
  const bitmap = await createImageBitmap(await res.blob())
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0)
  bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("사진을 PNG 로 바꾸지 못했습니다"))), "image/png")
  )
  return { data: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height }
}

async function block(b: PostBlock): Promise<Paragraph[]> {
  switch (b.type) {
    case "heading":
      return [new Paragraph({ children: [run(b.text, { bold: true, size: 26 })], spacing: { before: 360, after: 120 }, keepNext: true })]
    case "text":
      return [new Paragraph({ children: lines(b.text), spacing: { after: 160, line: 360 } })]
    case "quote":
      return [
        new Paragraph({
          children: [...lines(b.text, { italics: true }), ...(b.cite ? [run(` — ${b.cite}`, { color: GREY })] : [])],
          indent: { left: 360 },
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: "1F4E99", space: 8 } },
          spacing: { before: 120, after: 200, line: 360 },
        }),
      ]
    case "image": {
      const img = await toPng(b.src)
      const scale = Math.min(1, MAX_IMAGE_PX / img.width)
      const out = [
        new Paragraph({
          children: [
            new ImageRun({
              type: "png",
              data: img.data,
              transformation: { width: Math.round(img.width * scale), height: Math.round(img.height * scale) },
              altText: { name: b.alt || "사진", description: b.alt, title: b.alt },
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 80 },
          keepNext: !!b.caption,
        }),
      ]
      if (b.caption) {
        out.push(new Paragraph({ children: lines(b.caption, { size: 18, color: GREY }), alignment: AlignmentType.CENTER, spacing: { after: 240 } }))
      }
      return out
    }
    case "links":
      return [
        new Paragraph({ children: [run(b.title, { bold: true })], spacing: { before: 200, after: 80 }, keepNext: true }),
        ...b.items.map(
          (it) =>
            new Paragraph({
              children: [run(`· ${it.label}  `), link(it.href)],
              spacing: { after: 60 },
            })
        ),
      ]
  }
}

function link(href: string): ExternalHyperlink {
  return new ExternalHyperlink({
    link: href,
    children: [new TextRun({ text: href, font: FONT, size: 18, color: "1F4E99", underline: {} })],
  })
}

const ymd = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`

export async function buildColumnDocx(draft: Pick<Draft, "title" | "summary" | "blocks" | "status" | "keyword">): Promise<Blob> {
  const body: Paragraph[] = []
  for (const b of draft.blocks) body.push(...(await block(b)))

  const sources = draft.keyword.sources.map((s, i) => {
    const children: ParagraphChild[] = [
      run(`[${i + 1}] `, { bold: true, size: 18 }),
      run(`${s.publisher} · ${s.title}${s.date ? ` (${s.date.slice(0, 10)})` : ""}  `, { size: 18 }),
      link(s.url),
    ]
    return new Paragraph({ children, spacing: { after: 80 } })
  })

  const doc = new Document({
    creator: "HADD Science",
    title: draft.title,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [
      {
        children: [
          new Paragraph({
            children: [run(`검토용 초안 · ${DRAFT_LABEL[draft.status]} · 키워드 「${draft.keyword.term}」 · ${ymd(new Date())} 내보냄`, { size: 18, color: GREY })],
            spacing: { after: 240 },
          }),
          new Paragraph({ children: [run(draft.title, { bold: true, size: 32 })], spacing: { after: 160 } }),
          ...(draft.summary ? [new Paragraph({ children: lines(draft.summary, { bold: true, size: 24, color: "333333" }), spacing: { after: 360 } })] : []),
          ...body,
          ...(sources.length
            ? [
                new Paragraph({
                  children: [run("근거 기사 (검토용 · 게시할 때 본문의 [번호]와 함께 빠집니다)", { bold: true, size: 20 })],
                  spacing: { before: 480, after: 120 },
                  border: { top: { style: BorderStyle.SINGLE, size: 6, color: "C8D0DC", space: 12 } },
                  keepNext: true,
                }),
                ...sources,
              ]
            : []),
        ],
      },
    ],
  })
  return Packer.toBlob(doc)
}

/** `HADD칼럼_<제목 앞부분>_초안_<YYMMDD>.docx` — 파일 이름에 못 쓰는 글자는 뺀다. */
export function columnDocxName(title: string, now = new Date()): string {
  const head = title
    .replace(/^\[[^\]]*\]\s*/, "")
    .replace(/[\\/:*?"<>|'’‘“”,.·]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join("_")
  const d = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  return `HADD칼럼_${head || "제목없음"}_초안_${d}.docx`
}

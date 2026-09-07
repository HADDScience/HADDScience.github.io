import { zipSync } from "fflate"
import { toCanvas } from "html-to-image"

import { CARD_SIZE } from "@/lib/cardnews"

/**
 * 카드뉴스를 브라우저 안에서 그림으로 굽는다.
 *
 * 왜 브라우저인가 — 이 사이트는 정적 export 라 서버가 없고, 관리자 페이지도 그 정적
 * 번들 안에서 돈다. 헤드리스 Chrome 을 둘 곳이 없다. 대신 편집기 미리보기가 그리는
 * DOM 을 그대로 찍으므로 "미리보기와 결과물이 다른" 문제가 생기지 않는다.
 *
 * 원리 — html-to-image 가 노드를 복제해 계산된 스타일을 인라인하고 SVG foreignObject 에
 * 담아 캔버스에 그린다. 폰트와 이미지는 같은 출처에서 가져와 data URI 로 박아 넣는다.
 * Safari 는 foreignObject 안의 폰트·이미지 처리가 불안정하므로 **Chrome 을 권장**한다.
 */

/**
 * 노드 안의 이미지와 문서 폰트가 전부 준비될 때까지 기다린다. 미완 상태로 찍으면 빈 칸이 남는다.
 * 조판 검사(`lintCard`)도 같은 조건을 요구한다 — 폰트가 바뀌면 줄바꿈이 바뀌기 때문이다.
 */
export async function waitForAssets(node: HTMLElement) {
  await document.fonts.ready
  const imgs = Array.from(node.querySelectorAll("img"))
  await Promise.all(
    imgs.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true })
          img.addEventListener("error", () => resolve(), { once: true })
        })
      }
      try {
        await img.decode()
      } catch {
        // 깨진 이미지는 그대로 두고 진행한다. 빈 사진 박스가 찍힐 뿐 렌더는 된다.
      }
    })
  )
}

export async function rasterizeCard(node: HTMLElement): Promise<HTMLCanvasElement> {
  await waitForAssets(node)
  return toCanvas(node, {
    width: CARD_SIZE,
    height: CARD_SIZE,
    pixelRatio: 1,
    cacheBust: false,
  })
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/png" | "image/webp",
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("이미지를 변환하지 못했습니다"))),
      type,
      quality
    )
  })
}

export async function canvasToBytes(
  canvas: HTMLCanvasElement,
  type: "image/png" | "image/webp",
  quality?: number
): Promise<Uint8Array> {
  const blob = await canvasToBlob(canvas, type, quality)
  return new Uint8Array(await blob.arrayBuffer())
}

/** 긴 변이 `maxEdge` 를 넘지 않게 줄인 새 캔버스. 목록 썸네일용. */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  maxEdge: number
): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(canvas.width, canvas.height))
  if (scale === 1) return canvas
  const out = document.createElement("canvas")
  out.width = Math.round(canvas.width * scale)
  out.height = Math.round(canvas.height * scale)
  const ctx = out.getContext("2d")
  if (!ctx) throw new Error("캔버스를 만들 수 없습니다")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(canvas, 0, 0, out.width, out.height)
  return out
}

/** 파일 여럿을 zip 하나로 내려받는다. PNG 는 이미 압축돼 있어 level 0 으로 묶기만 한다. */
export function downloadZip(
  files: { name: string; bytes: Uint8Array }[],
  zipName: string
) {
  const entries: Record<string, Uint8Array> = {}
  for (const f of files) entries[f.name] = f.bytes
  const zipped = zipSync(entries, { level: 0 })
  const blob = new Blob([zipped], { type: "application/zip" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = zipName
  document.body.appendChild(a)
  a.click()
  a.remove()
  // 클릭 직후 revoke 하면 일부 브라우저가 다운로드를 시작하지 못한다.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

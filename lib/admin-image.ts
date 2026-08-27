/**
 * 업로드 이미지를 저장소에 넣기 전에 브라우저에서 줄인다.
 *
 * 이미지가 git 저장소에 그대로 쌓이는 구조라(파일 스토리지를 따로 두지 않기로 했다)
 * 원본 사진을 그대로 커밋하면 저장소가 금방 GitHub Pages 의 1GB 한도에 닿는다.
 * 스마트폰 사진 한 장이 4~8MB, 여기서 나오는 결과물은 100~300KB 다.
 */
const MAX_EDGE = 1600
const QUALITY = 0.82

export interface PreparedImage {
  /** 저장소에 넣을 webp 바이트 */
  bytes: Uint8Array
  /** 미리보기용 object URL. 화면을 떠날 때 revoke 해야 한다. */
  previewUrl: string
  width: number
  height: number
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("캔버스를 만들 수 없습니다")
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY)
  )
  if (!blob) throw new Error("이미지를 변환하지 못했습니다")

  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    previewUrl: URL.createObjectURL(blob),
    width,
    height,
  }
}

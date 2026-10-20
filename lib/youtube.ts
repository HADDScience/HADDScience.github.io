/**
 * 기사 본문 영상 블록의 유튜브 주소 처리.
 *
 * 블록에는 주소가 아니라 영상 ID 만 저장한다(Omnis `lib/schemas/website.ts` 가 같은 정규식으로 거른다).
 * 편집기는 사람이 붙여 넣은 주소에서 ID 와 시작 위치를 뽑고, 화면은 ID 로 임베드 주소를 만든다.
 */

export const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/

const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
])

/** `355` · `355s` · `5m55s` · `1h2m3s` → 초. 읽지 못하면 undefined. */
function parseTime(raw: string | null): number | undefined {
  if (!raw) return undefined
  if (/^\d+s?$/.test(raw)) return parseInt(raw, 10)
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(raw)
  if (!m || !m[0]) return undefined
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
}

/**
 * youtu.be/ID · watch?v=ID · shorts/ID · embed/ID · live/ID, 그리고 ID 만 붙여 넣은 것까지.
 * 시작 위치는 `t=`·`start=`(쿼리 또는 #) 에서 읽는다. 유튜브 주소가 아니면 null.
 */
export function parseYouTube(input: string): { id: string; start?: number } | null {
  const s = input.trim()
  if (YOUTUBE_ID.test(s)) return { id: s }

  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`)
  } catch {
    return null
  }
  const host = url.hostname.toLowerCase()
  const path = url.pathname.split("/").filter(Boolean)

  let id: string | undefined
  if (host === "youtu.be") id = path[0]
  else if (HOSTS.has(host)) {
    if (path[0] === "watch") id = url.searchParams.get("v") ?? undefined
    else if (["shorts", "embed", "live", "v"].includes(path[0])) id = path[1]
  }
  if (!id || !YOUTUBE_ID.test(id)) return null

  const hash = new URLSearchParams(url.hash.slice(1))
  const start = parseTime(
    url.searchParams.get("t") ?? url.searchParams.get("start") ?? hash.get("t") ?? hash.get("start")
  )
  return start ? { id, start } : { id }
}

/** 화면에 끼울 주소. 쿠키를 남기지 않는 youtube-nocookie 를 쓴다. ID 가 형식에 맞지 않으면 null. */
export function youtubeEmbedSrc(id: string, start?: number): string | null {
  if (!YOUTUBE_ID.test(id)) return null
  return `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}`
}

/** 유튜브에서 보는 주소. 워드 내보내기처럼 iframe 을 넣을 수 없는 곳에 쓴다. */
export function youtubeWatchUrl(id: string, start?: number): string {
  return `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ""}`
}

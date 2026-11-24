/**
 * 지원서 파일 조각 올리기(③) — 브라우저에서 옴니스로 바로 보낸다. 홈페이지 서버를 거치지 않는다
 * (Vercel Function 본문 한도 4.5MB 보다 이력서 상한 10MB 가 크다).
 *
 * 계약 3절(`~/work/omnis-reports/omnis-hr-api-contract-261124.md`):
 * - `PUT {url}?part={n}`, `Authorization: Ticket <ticket>`, 본문은 조각 바이트. 조각은 **차례로 하나씩**.
 * - 204 다음 조각 · 400 not_pdf 파일 칸으로 · 401 티켓 만료(지원서를 다시 열어 새 티켓) ·
 *   409 not_receiving 이미 접수됨(확정으로) · 503 같은 조각 한 번만 다시 · 나머지는 실패(메일 되돌림).
 * - 같은 조각을 다시 보내도 결과가 같으므로 네트워크 오류에도 한 번 다시 보낸다.
 */

export interface UploadTicket {
  slot: "resume" | "portfolio"
  url: string
  ticket: string
  size: number
  partBytes: number
  parts: number
  expiresAt: string
}

export type UploadResult = "ok" | "not_pdf" | "bad_ticket" | "not_receiving" | "failed"

/** 조각 하나가 기다리는 시간. NAS 첫 조각은 폴더를 만드느라 10초 넘게 걸린 적이 있다(옴니스 실측 11.9초). */
const PART_TIMEOUT_MS = 60_000

export async function uploadFile(
  ticket: UploadTicket,
  file: Blob,
  onProgress: (sentBytes: number) => void
): Promise<UploadResult> {
  if (file.size !== ticket.size) return "failed"
  for (let part = 0; part < ticket.parts; part++) {
    const start = part * ticket.partBytes
    const end = Math.min(ticket.size, start + ticket.partBytes)
    const result = await putPart(ticket, part, file.slice(start, end))
    if (result !== "ok") return result
    onProgress(end)
  }
  return "ok"
}

async function putPart(ticket: UploadTicket, part: number, body: Blob): Promise<UploadResult> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    let res: Response
    try {
      res = await fetch(`${ticket.url}?part=${part}`, {
        method: "PUT",
        headers: {
          Authorization: `Ticket ${ticket.ticket}`,
          "Content-Type": "application/octet-stream",
        },
        body,
        credentials: "omit",
        signal: AbortSignal.timeout(PART_TIMEOUT_MS),
      })
    } catch {
      if (attempt === 1) continue
      return "failed"
    }
    if (res.status === 204 || res.ok) return "ok"
    if (res.status === 503 && attempt === 1) continue
    if (res.status === 409) return "not_receiving"
    if (res.status === 401) return "bad_ticket"
    if (res.status === 400) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      return data?.error === "not_pdf" ? "not_pdf" : "failed"
    }
    return "failed"
  }
  return "failed"
}

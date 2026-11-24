import { NextRequest, NextResponse } from "next/server"

import { omnisFetch } from "@/lib/omnis-fetch"
import { OMNIS_API_BASE } from "@/lib/site-env"

/**
 * 지원서 접수 ④ → ⑤ — 파일을 다 올린 브라우저가 부른다. 비밀을 달아 옴니스의 접수 확정을 중계한다.
 *
 * 봇 거르기는 ① 에서 끝났다. 여기서는 id 가 uuid 모양인지만 본다(계약 4절).
 * 2xx 면 `{ code }`(접수 번호), 409 `upload_incomplete` 면 빠진 파일을 알려 주고, 나머지는 503 이다 —
 * 폼은 503 을 보고 메일 되돌림을 띄운다. 마감은 ① 에서 이미 봤다. 마감 직전에 열어 마감 뒤에 확정하는
 * 지원서도 받는다 — 지원서를 낸 시점은 ① 이다.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { id?: unknown } | null
  const id = typeof body?.id === "string" ? body.id : ""
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 })
  }

  const secret = process.env.CAREER_SECRET
  if (!secret) {
    console.error("[career] CAREER_SECRET 이 없다. 접수 확정을 중계하지 않았다.")
    return NextResponse.json({ error: "unavailable" }, { status: 503 })
  }

  let res: Response
  try {
    res = await omnisFetch(`${OMNIS_API_BASE}/applications/${id}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    })
  } catch (err) {
    console.error("[career] 접수 확정 — 옴니스에 닿지 못했다:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "unavailable" }, { status: 503 })
  }

  const data = (await res.json().catch(() => null)) as {
    code?: string
    error?: string
    missing?: string[]
  } | null
  if (res.ok && typeof data?.code === "string") {
    return NextResponse.json({ ok: true, code: data.code }, { status: 201 })
  }
  if (res.status === 409 && data?.error === "upload_incomplete") {
    return NextResponse.json({ error: "upload_incomplete", missing: data.missing ?? [] }, { status: 409 })
  }
  console.error(`[career] 접수 확정 실패: HTTP ${res.status} ${data?.error ?? ""}`)
  return NextResponse.json({ error: "unavailable" }, { status: 503 })
}

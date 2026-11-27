import { NextRequest, NextResponse } from "next/server"

import { INVITE_SECRET_ENV, verifyInvite } from "@/lib/career-invite"

/**
 * 초대 토큰이 이 공고에 지금 유효한가(화면이 묻는다). 비밀은 서버에만 있다.
 * 개인정보는 없다 — 꼬리표(익명 id)도 돌려주지 않고 유효 여부 · 만료 시각만 준다.
 */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? ""
  const token = req.nextUrl.searchParams.get("invite") ?? ""
  const r = verifyInvite(token, slug, Date.now(), process.env[INVITE_SECRET_ENV])
  return NextResponse.json(r.ok ? { valid: true, expiresAt: r.expiresAt } : { valid: false }, { headers: { "Cache-Control": "no-store" } })
}

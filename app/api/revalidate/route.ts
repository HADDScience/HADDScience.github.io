import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

import { POSTS_TAG } from "@/content/server"

/**
 * Omnis 가 기사를 저장·삭제한 뒤 부른다. 기사 캐시(60초)를 기다리지 않고 바로 비운다.
 * 비밀은 Omnis 의 WEBSITE_REVALIDATE_SECRET 과 같은 값. 없으면 이 경로는 닫힌다.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "")
  if (!secret || given !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }
  revalidateTag(POSTS_TAG, "max")
  return NextResponse.json({ revalidated: true, at: Date.now() })
}

#!/usr/bin/env node
/**
 * 마감된 공고의 개인 초대 링크를 만든다(lib/career-invite.ts 와 같은 꼴).
 *
 *   CAREER_INVITE_SECRET=… node scripts/career-invite.mjs <slug> <만료 ISO> <꼬리표> [lang]
 *   예) node scripts/career-invite.mjs suwon-anchor-practicum-intern-2026-winter 2026-11-30T00:00:00+09:00 inv-001
 *
 * 비밀은 env 로만 받는다(화면에 찍지 않는다). 꼬리표는 익명 id(영문 · 숫자 · 하이픈 2~40자) — 이름 · 전화를 넣지 않는다.
 * 비밀이 없으면 .env.local 에서 CAREER_INVITE_SECRET 한 줄을 읽는다.
 */
import { createHmac } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"

const [slug, expiresIso, tag, lang = "ko"] = process.argv.slice(2)
if (!slug || !expiresIso || !tag) {
  console.error("사용법: node scripts/career-invite.mjs <slug> <만료 ISO, 시간대 포함> <꼬리표> [ko|en]")
  process.exit(1)
}
let secret = process.env.CAREER_INVITE_SECRET
if (!secret && existsSync(".env.local")) secret = readFileSync(".env.local", "utf8").match(/^CAREER_INVITE_SECRET=["']?([^"'\n]+)/m)?.[1]
if (!secret || secret.length < 32) {
  console.error("CAREER_INVITE_SECRET 이 없거나 짧다(32자 이상)")
  process.exit(1)
}
if (!/^[A-Za-z0-9-]{2,40}$/.test(tag)) {
  console.error("꼬리표는 영문 · 숫자 · 하이픈 2~40자(익명 id) — 이름 · 전화 · 메일을 넣지 않는다")
  process.exit(1)
}
const e = Date.parse(expiresIso)
if (!Number.isFinite(e) || !/[+-]\d\d:\d\d$|Z$/.test(expiresIso)) {
  console.error("만료 시각은 시간대까지 적는다 — 2026-11-30T00:00:00+09:00")
  process.exit(1)
}
const b64 = (b) => b.toString("base64url")
const body = b64(Buffer.from(JSON.stringify({ s: slug, e, t: tag })))
const token = `${body}.${b64(createHmac("sha256", secret).update(body).digest())}`
const origin = process.env.SITE_ORIGIN ?? "https://haddscience.com"
console.log(`${origin}/${lang}/career/${slug}?invite=${token}#apply`)

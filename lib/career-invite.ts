/**
 * 마감된 공고에 한 사람만 늦게 지원하게 하는 개인 초대 토큰(2026-11-27).
 *
 * 토큰 = base64url(JSON { s: slug, e: 만료 epoch ms, t: 꼬리표 }) + "." + base64url(HMAC-SHA256)
 * - 비밀은 서버 env `CAREER_INVITE_SECRET` 하나다. 토큰은 `scripts/career-invite.mjs` 로 만든다.
 * - 꼬리표(t)는 익명 id 다. 이름 · 전화 · 메일 같은 개인정보를 넣지 않는다(만드는 스크립트가 꼴을 막는다).
 * - 만료 · 서명 틀림 · 다른 공고면 지금처럼 마감이다.
 *
 * 서버 전용(node:crypto). 화면은 `/api/career/invite` 로 유효한지만 묻는다.
 */
import { createHmac, timingSafeEqual } from "node:crypto"

export const INVITE_SECRET_ENV = "CAREER_INVITE_SECRET"
/** 꼬리표 꼴 — 영문 · 숫자 · 하이픈 2~40자. 이름 · 전화 · 메일이 들어갈 수 없다 */
export const INVITE_TAG = /^[A-Za-z0-9-]{2,40}$/
/** 지원서함에서 추가 접수로 알아보는 표시. 옴니스가 모르는 칸 대신 지원 동기 앞에 붙인다 */
export const INVITE_MARK = "[추가 접수(초대)]"

export interface InvitePayload {
  s: string
  e: number
  t: string
}

const b64 = (b: Buffer) => b.toString("base64url")
const sign = (body: string, secret: string) => b64(createHmac("sha256", secret).update(body).digest())

export function makeInvite(p: InvitePayload, secret: string): string {
  if (!secret || secret.length < 32) throw new Error("비밀이 너무 짧다(32자 이상)")
  if (!INVITE_TAG.test(p.t)) throw new Error("꼬리표는 영문 · 숫자 · 하이픈 2~40자(익명 id)")
  if (!Number.isFinite(p.e)) throw new Error("만료 시각이 없다")
  const body = b64(Buffer.from(JSON.stringify({ s: p.s, e: p.e, t: p.t })))
  return `${body}.${sign(body, secret)}`
}

export type InviteCheck =
  | { ok: true; tag: string; expiresAt: number }
  | { ok: false; reason: "missing" | "malformed" | "signature" | "expired" | "other_job" | "unconfigured" }

export function verifyInvite(token: unknown, slug: string, now: number, secret: string | undefined): InviteCheck {
  if (!secret) return { ok: false, reason: "unconfigured" }
  if (typeof token !== "string" || token === "") return { ok: false, reason: "missing" }
  if (token.length > 400) return { ok: false, reason: "malformed" }
  const [body, sig, extra] = token.split(".")
  if (!body || !sig || extra !== undefined) return { ok: false, reason: "malformed" }
  const want = Buffer.from(sign(body, secret))
  const got = Buffer.from(sig)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return { ok: false, reason: "signature" }
  let p: Partial<InvitePayload>
  try {
    p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<InvitePayload>
  } catch {
    return { ok: false, reason: "malformed" }
  }
  if (typeof p.s !== "string" || typeof p.e !== "number" || typeof p.t !== "string" || !INVITE_TAG.test(p.t)) {
    return { ok: false, reason: "malformed" }
  }
  if (p.s !== slug) return { ok: false, reason: "other_job" }
  if (now >= p.e) return { ok: false, reason: "expired" }
  return { ok: true, tag: p.t, expiresAt: p.e }
}

/** 지원 동기 앞에 추가 접수 표시를 붙인다. 길이 한도를 넘으면 끝을 잘라 맞춘다 */
export function markMotivation(motivation: string, max: number): string {
  const marked = `${INVITE_MARK} ${motivation}`
  return marked.length <= max ? marked : marked.slice(0, max)
}

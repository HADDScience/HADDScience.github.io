// 개인 초대 토큰 시험 — npx tsx --test lib/career-invite.test.ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { INVITE_MARK, makeInvite, markMotivation, verifyInvite } from "./career-invite"

const SECRET = "x".repeat(48)
const SLUG = "example-job"
const EXP = Date.parse("2026-11-30T00:00:00+09:00")
const BEFORE = EXP - 3600_000

test("유효한 토큰 — 같은 공고 · 만료 전", () => {
  const t = makeInvite({ s: SLUG, e: EXP, t: "inv-001" }, SECRET)
  assert.deepEqual(verifyInvite(t, SLUG, BEFORE, SECRET), { ok: true, tag: "inv-001", expiresAt: EXP })
})

test("만료 · 다른 공고 · 서명 틀림 · 비밀 없음 · 꼴 틀림은 마감", () => {
  const t = makeInvite({ s: SLUG, e: EXP, t: "inv-001" }, SECRET)
  assert.equal(verifyInvite(t, SLUG, EXP, SECRET).ok, false)
  assert.deepEqual(verifyInvite(t, "other-job", BEFORE, SECRET), { ok: false, reason: "other_job" })
  assert.deepEqual(verifyInvite(t, SLUG, BEFORE, "y".repeat(48)), { ok: false, reason: "signature" })
  assert.deepEqual(verifyInvite(t, SLUG, BEFORE, undefined), { ok: false, reason: "unconfigured" })
  assert.deepEqual(verifyInvite("", SLUG, BEFORE, SECRET), { ok: false, reason: "missing" })
  assert.deepEqual(verifyInvite("abc", SLUG, BEFORE, SECRET), { ok: false, reason: "malformed" })
  // 몸통을 바꾸면(만료를 늘리면) 서명이 맞지 않는다
  const [, sig] = t.split(".")
  const forged = Buffer.from(JSON.stringify({ s: SLUG, e: EXP + 86_400_000, t: "inv-001" })).toString("base64url") + "." + sig
  assert.deepEqual(verifyInvite(forged, SLUG, EXP + 1000, SECRET), { ok: false, reason: "signature" })
})

test("꼬리표에 개인정보를 넣을 수 없다 — 익명 id 꼴만", () => {
  assert.throws(() => makeInvite({ s: SLUG, e: EXP, t: "홍길동" }, SECRET))
  assert.throws(() => makeInvite({ s: SLUG, e: EXP, t: "a@b.com" }, SECRET))
  assert.throws(() => makeInvite({ s: SLUG, e: EXP, t: "010 1234 5678" }, SECRET))
  assert.throws(() => makeInvite({ s: SLUG, e: EXP, t: "inv-001" }, "short"))
})

test("지원 동기 앞에 추가 접수 표시 — 한도를 넘지 않는다", () => {
  assert.equal(markMotivation("열심히 하겠습니다", 1500), `${INVITE_MARK} 열심히 하겠습니다`)
  assert.equal(markMotivation("가".repeat(1500), 1500).length, 1500)
})

test("만드는 스크립트와 서버 검사가 같은 꼴이다", () => {
  const url = execFileSync("node", ["scripts/career-invite.mjs", SLUG, "2026-11-30T00:00:00+09:00", "inv-002"], { env: { ...process.env, CAREER_INVITE_SECRET: SECRET, SITE_ORIGIN: "https://example.com" } }).toString().trim()
  assert.match(url, /^https:\/\/example\.com\/ko\/career\/example-job\?invite=[^#]+#apply$/)
  const token = new URL(url).searchParams.get("invite")!
  assert.deepEqual(verifyInvite(token, SLUG, BEFORE, SECRET), { ok: true, tag: "inv-002", expiresAt: EXP })
  // 개인정보 꼴 꼬리표는 스크립트도 거절한다
  assert.throws(() => execFileSync("node", ["scripts/career-invite.mjs", SLUG, "2026-11-30T00:00:00+09:00", "홍길동"], { env: { ...process.env, CAREER_INVITE_SECRET: SECRET }, stdio: "pipe" }))
})

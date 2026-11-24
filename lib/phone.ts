/**
 * 지원서 연락처 칸의 자동 대시. 숫자만 쳐도, 붙여 넣어도 「010-1234-5678」 꼴로 맞춘다.
 *
 * 서버 검사(`lib/career-application.ts` 의 PHONE: 숫자 · + · - · 공백 · 괄호, 9~30자)와 어긋나지 않게
 * 숫자와 대시만 만든다. `+` 로 시작하는 국제 번호는 사람이 쓴 그대로 둔다(나라마다 묶는 법이 달라서).
 *
 * 묶는 법(국내):
 * - 02(서울): 02-123-4567 · 02-1234-5678
 * - 15xx · 16xx · 18xx 대표번호(8자리): 1588-1234
 * - 그 밖(010 · 031 · 070 …): 010-123-4567 · 010-1234-5678
 * 입력 중에는 친 만큼만 묶는다(「0101」 → 「010-1」).
 */
export function formatPhone(input: string): string {
  const raw = input.trim()
  if (raw.startsWith("+")) return input
  const d = raw.replace(/\D/g, "").slice(0, 11)
  if (d === "") return ""

  if (d.startsWith("02")) {
    if (d.length <= 2) return d
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`
  }
  if (/^1[5-9]/.test(d)) {
    if (d.length <= 4) return d
    return `${d.slice(0, 4)}-${d.slice(4, 8)}`
  }
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

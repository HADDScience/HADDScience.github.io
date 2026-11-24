/**
 * 지원서 검사 규칙. 폼(`components/forms/application-form.tsx`)과 API(`app/api/career/apply`)가
 * 같은 함수를 쓴다 — 둘이 어긋나면 방문자가 화면에서는 통과하고 서버에서 거절당한다.
 *
 * 클라이언트에서도 임포트하므로 서버 전용 모듈을 끌어오지 않는다.
 */

export const APPLICATION_MAX = {
  name: 100,
  department: 100,
  studentId: 20,
  graduation: 50,
  phone: 30,
  email: 200,
  portfolioUrl: 500,
  motivation: 1500,
} as const

/**
 * 파일 한 개의 상한. 파일은 이 사이트의 API 를 거치지 않고 브라우저가 옴니스로 조각(4MB) 업로드한다 —
 * Vercel Function 본문 한도 4.5MB 와 상관없다.
 * 이력서 10MB, 포트폴리오 30MB(2026-11-24 사용자 결정 — 작업물 PDF 는 이력서보다 크다).
 * 옴니스 검사(`lib/hr/rules.ts`)의 상한과 같아야 한다. 어긋나면 화면은 통과하고 옴니스가 400 을 줘
 * 메일 되돌림으로 떨어진다.
 */
export const APPLICATION_FILE_MAX_BYTES = 10 * 1024 * 1024
export const PORTFOLIO_FILE_MAX_BYTES = 30 * 1024 * 1024

export const GRADES = ["3", "4"] as const

export type ApplicationIssue =
  | "required"
  | "invalidEmail"
  | "invalidPhone"
  | "invalidStudentId"
  | "invalidUrl"
  | "notPdf"
  | "tooLarge"
  | "portfolioTooLarge"
  | "tooLong"

export type ApplicationField =
  | keyof typeof APPLICATION_MAX
  | "grade"
  | "resume"
  | "portfolioFile"
  | "consent"

export interface FileMeta {
  name: string
  size: number
  type: string
}

export interface ApplicationPayload {
  job: string
  name: string
  department: string
  studentId: string
  grade: string
  graduation: string
  phone: string
  email: string
  resume: FileMeta | null
  portfolioFile: FileMeta | null
  portfolioUrl: string
  /** 고른 「관심 있는 일」의 value. 선택 사항이라 비어 있어도 된다. API 가 공고의 tracks 로 거른다. */
  interests: string[]
  motivation: string
  consent: boolean
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^[0-9+\-\s()]{9,30}$/
const DIGITS = /^\d+$/

/**
 * PDF 파일인가 — 이름이 .pdf 로 끝나야 한다. 옴니스 검사(`lib/hr/rules.ts` fileMeta)가 이름으로 보기 때문에
 * 여기서도 이름으로 본다. 예전에는 type 이 application/pdf 면 이름과 상관없이 통과시켜, 화면은 통과하고
 * 옴니스가 400 을 주는 틈이 있었다(2026-11-24 운영 지원 실패 조사). 실제 내용이 PDF 인지는 옴니스가 첫
 * 조각의 %PDF 로 다시 본다.
 */
export function isPdf(file: FileMeta): boolean {
  return file.name.toLowerCase().endsWith(".pdf")
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function checkFile(
  file: FileMeta,
  slot: "resume" | "portfolio" = "resume"
): ApplicationIssue | null {
  if (!isPdf(file)) return "notPdf"
  // 빈 파일은 옴니스가 받지 않는다(크기 1 이상).
  if (file.size < 1) return "required"
  if (slot === "portfolio") return file.size > PORTFOLIO_FILE_MAX_BYTES ? "portfolioTooLarge" : null
  return file.size > APPLICATION_FILE_MAX_BYTES ? "tooLarge" : null
}

/** 칸별 문제를 돌려준다. 비어 있으면 통과. */
export function validateApplication(
  p: ApplicationPayload
): Partial<Record<ApplicationField, ApplicationIssue>> {
  const issues: Partial<Record<ApplicationField, ApplicationIssue>> = {}
  const text = (field: keyof typeof APPLICATION_MAX, required: boolean) => {
    const value = p[field]
    if (required && value === "") issues[field] = "required"
    else if (value.length > APPLICATION_MAX[field]) issues[field] = "tooLong"
  }

  text("name", true)
  text("department", true)
  text("studentId", true)
  text("graduation", true)
  text("phone", true)
  text("email", true)
  text("motivation", true)
  text("portfolioUrl", false)

  if (!issues.studentId && !DIGITS.test(p.studentId)) issues.studentId = "invalidStudentId"
  if (!issues.phone && !PHONE.test(p.phone)) issues.phone = "invalidPhone"
  if (!issues.email && !EMAIL.test(p.email)) issues.email = "invalidEmail"
  if (!issues.portfolioUrl && p.portfolioUrl !== "" && !isHttpUrl(p.portfolioUrl)) {
    issues.portfolioUrl = "invalidUrl"
  }
  if (!(GRADES as readonly string[]).includes(p.grade)) issues.grade = "required"

  if (p.resume === null) issues.resume = "required"
  else {
    const issue = checkFile(p.resume)
    if (issue) issues.resume = issue
  }
  if (p.portfolioFile !== null) {
    const issue = checkFile(p.portfolioFile, "portfolio")
    if (issue) issues.portfolioFile = issue
  }

  if (p.consent !== true) issues.consent = "required"
  return issues
}

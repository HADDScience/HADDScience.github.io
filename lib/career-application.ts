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
 * 파일 한 개의 상한. Vercel Function 본문 한도가 4.5MB 라서 파일은 API 본문으로 받을 수 없다 —
 * 저장소가 정해지면 브라우저가 저장소로 직접 올리고, API 에는 메타데이터만 온다.
 */
export const APPLICATION_FILE_MAX_BYTES = 10 * 1024 * 1024

export const GRADES = ["3", "4"] as const

export type ApplicationIssue =
  | "required"
  | "invalidEmail"
  | "invalidPhone"
  | "invalidStudentId"
  | "invalidUrl"
  | "notPdf"
  | "tooLarge"
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

export function isPdf(file: FileMeta): boolean {
  // 브라우저가 type 을 비워 보내는 경우가 있어 확장자도 본다.
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function checkFile(file: FileMeta): ApplicationIssue | null {
  if (!isPdf(file)) return "notPdf"
  if (file.size > APPLICATION_FILE_MAX_BYTES) return "tooLarge"
  return null
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
    const issue = checkFile(p.portfolioFile)
    if (issue) issues.portfolioFile = issue
  }

  if (p.consent !== true) issues.consent = "required"
  return issues
}

import { Geist_Mono } from "next/font/google"
import localFont from "next/font/local"

/**
 * 사이트와 관리자 페이지가 같은 글꼴을 쓰도록 한곳에 모은다.
 * next/font 는 모듈 최상위에서만 호출할 수 있어 레이아웃마다 중복 선언하면
 * 서로 다른 폰트 인스턴스가 생긴다.
 */

// 디자인시스템 tokens/fonts.css 의 @font-face 와 동일한 가변 축(45~920).
export const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920",
  style: "normal",
  display: "swap",
  variable: "--font-sans",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Apple SD Gothic Neo",
    "Malgun Gothic",
    "sans-serif",
  ],
})

export const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

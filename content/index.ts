/**
 * 클라이언트에서도 안전한 것만 둔다.
 *
 * 콘텐츠 본문을 읽는 `getContent` 는 `@/content/server` 에 있다. 그쪽은 `node:fs` 를
 * 쓰므로 클라이언트 번들에 들어가면 안 된다. 이 파일은 네비·언어 스위처 같은 클라이언트
 * 컴포넌트가 임포트하므로 순수 헬퍼와 타입만 남긴다.
 */
import type { Lang } from "./types"

export const LANGS = ["ko", "en"] as const
export const DEFAULT_LANG: Lang = "ko"

/** 콘텐츠가 준비된 언어. 새 언어를 추가하려면 딕셔너리와 함께 여기에 넣는다. */
export const AVAILABLE_LANGS: Lang[] = ["ko", "en"]

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value)
}

/** 언어 접두사가 붙은 경로를 만든다. `/about` -> `/ko/about` */
export function localePath(lang: Lang, href: string): string {
  if (href.startsWith("http") || href.startsWith("#")) return href
  return `/${lang}${href === "/" ? "" : href}`
}

export type { Lang, SiteContent } from "./types"

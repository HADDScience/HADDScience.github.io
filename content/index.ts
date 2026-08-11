import { en } from "./en"
import { ko } from "./ko"
import { newsEn } from "./news.en"
import { newsKo } from "./news.ko"
import type { Lang, SiteContent } from "./types"

export const LANGS = ["ko", "en"] as const
export const DEFAULT_LANG: Lang = "ko"

/** 콘텐츠가 준비된 언어. 새 언어를 추가하려면 딕셔너리와 함께 여기에 넣는다. */
export const AVAILABLE_LANGS: Lang[] = ["ko", "en"]

const dictionaries: Record<Lang, SiteContent> = {
  ko: { ...ko, news: { ...ko.news, items: newsKo } },
  en: { ...en, news: { ...en.news, items: newsEn } },
}

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value)
}

export function getContent(lang: Lang): SiteContent {
  return dictionaries[lang] ?? dictionaries[DEFAULT_LANG]
}

/** 언어 접두사가 붙은 경로를 만든다. `/about` -> `/ko/about` */
export function localePath(lang: Lang, href: string): string {
  if (href.startsWith("http") || href.startsWith("#")) return href
  return `/${lang}${href === "/" ? "" : href}`
}

export type { Lang, SiteContent }

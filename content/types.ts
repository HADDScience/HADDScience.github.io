export type Lang = "ko" | "en"

export interface NavChild {
  label: string
  href: string
}

export interface NavItem {
  label: string
  href: string
  children?: NavChild[]
}

export interface HeroSlide {
  eyebrow?: string
  title: string[]
  description: string[]
  cta?: { label: string; href: string }
  image?: string
}

export interface Feature {
  index: string
  title: string
  description: string
}

export interface Stat {
  value: string
  suffix?: string
  label: string
}

export interface ProductVariant {
  id: string
  name: string
  form: string
  image: string
  storage: string
  sampleRequest: boolean
  sampleNote: string
}

export interface ProductFamily {
  id: string
  name: string
  eyebrow: string
  tagline: string
  heading: string
  description: string
  regulatory: string
  href: string
  variants: ProductVariant[]
}

/**
 * 기사 본문 블록.
 *
 * 아임웹 시절 기사는 본문이 통째로 카드뉴스 이미지였다(텍스트 0자). 그래서 스크린리더도
 * 검색엔진도 내용을 읽지 못했다. 앞으로 쓰는 글은 text 블록을 본문으로 삼고, 이미지는
 * 보조로 붙인다.
 *
 * text 블록은 자동 번역 대상이고, image 블록은 언어별로 직접 넣는다 — 카드뉴스처럼
 * 이미지 안에 글자가 박히는 경우가 있어 공용으로 쓸 수 없기 때문이다.
 */
export type PostBlock =
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; src: string; alt: string; caption?: string }

export interface PostLocale {
  title: string
  /** 목록 카드 · 검색 · OG 설명에 쓰는 한두 문장. */
  summary: string
  blocks: PostBlock[]
  /**
   * 이 번역이 만들어진 원문의 해시. 원문이 바뀌면 값이 달라지고, CI 의 번역 스크립트가
   * 그 차이를 보고 다시 번역한다. 원문 로케일에는 없다.
   */
  translatedFrom?: string
  /**
   * 사람이 직접 손댄 번역. 자동 번역이 덮어쓰지 않는다.
   * 관리자 페이지에서 원문이 아닌 언어를 편집하면 켜진다.
   */
  manual?: boolean
}

/**
 * 기사 한 건. `content/data/news/<id>.json` 한 파일이 이 모양이다.
 * 모든 언어를 한 파일에 담아 원문과 번역이 항상 같은 커밋에서 움직이게 한다.
 */
export interface Post {
  id: string
  /** 표시용 날짜 문자열. `2026.07.08` */
  date: string
  /** 번역 원본 언어. 번역 스크립트가 이 언어를 읽어 나머지를 채운다. */
  sourceLang: Lang
  /** 목록 카드 썸네일. 언어 공통이다. */
  thumbnail: string
  /** 본문을 아직 옮기지 않은 글은 아임웹 원문으로 보낸다. 옮기면 null 로 바꾼다. */
  externalHref: string | null
  content: Partial<Record<Lang, PostLocale>>
}

/** 목록에서 쓰는 표시용 모델. Post 에서 언어 하나를 골라 만든다. */
export interface NewsItem {
  id: string
  date: string
  title: string
  image: string
  href: string
  /** 목록 카드에 보여줄 한두 문장. 없으면 제목만 나온다. */
  summary?: string
  /** 사이트 안에 상세 페이지가 있는가. 없으면 `href` 가 아임웹 원문을 가리킨다. */
  hasArticle: boolean
}

export interface LibraryItem {
  date: string
  title: string
  excerpt: string
}

export interface TeamMember {
  role: string
  name: string
  specialty: string
  bio: string
  /** haddscience.com/Team 의 인물 사진. scripts/fetch-team-photos.mjs 가 가져온다. */
  photo: string
}

export interface OfficeLocation {
  kind: string
  name: string
  address: string
  /**
   * 지도 검색어. 좌표가 아니라 질의문으로 두는 이유는 API 키 없이 쓰는
   * 임베드가 질의 기반이고, 주소가 바뀌면 이 문자열만 고치면 되기 때문이다.
   */
  mapQuery: string
}

export interface SiteContent {
  meta: {
    lang: Lang
    title: string
    description: string
  }
  company: {
    nameKo: string
    nameEn: string
    slogan: string
    ceo: string
    businessNumber: string
    tel: string
    fax: string
    email: string
    ceoEmail: string
    workingTime: string
    locations: OfficeLocation[]
  }
  nav: NavItem[]
  navCta: string
  /** 컴포넌트 크롬 문자열 — 라벨, aria-label, 배지 등. */
  ui: {
    menu: string
    languageSelect: string
    languageNotReady: string
    pagination: string
    prevPage: string
    nextPage: string
    viewDetail: string
    storage: string
    intendedUse: string
    sampleAvailable: string
    sampleUnavailable: string
    mainLine: string
    fax: string
    inquirySubjectPrefix: string
  }
  legal: {
    breadcrumb: string
    termsHeading: string
    termsBody: string
    privacyHeading: string
    privacyBody: string
  }
  home: {
    heroSlides: HeroSlide[]
    stats: Stat[]
    productSection: { eyebrow: string; title: string; heading: string; cta: string }
    newsSection: { eyebrow: string; title: string; description: string; cta: string }
    aboutSection: { eyebrow: string; title: string; body: string[]; cta: string }
    /**
     * 랜딩 첫 화면의 고정 배경 위로 올라오는 패널들.
     * 히어로는 heroSlides[0] 을 그대로 쓰고, 아래 둘은 이 스테이지 전용 카피다.
     */
    stage: {
      vision: { eyebrow: string; title: string[]; body: string[] }
      lineup: { eyebrow: string; title: string; description: string }
      scrollHint: string
    }
    partners: { eyebrow: string; title: string; description: string }
    ctaBand: { tag: string; title: string; description: string; cta: string }
  }
  about: {
    pageTitle: string
    breadcrumb: string
    headline: string
    lead: string[]
    story: { title: string; body: string[] }
    whatWeDo: { title: string; items: Feature[] }
    team: { title: string; quote: string; cta: string }
    culture: { title: string; values: string[] }
    cta: { title: string; description: string; label: string }
  }
  team: {
    pageTitle: string
    breadcrumb: string
    headline: string[]
    intro: string[]
    members: TeamMember[]
  }
  location: {
    pageTitle: string
    breadcrumb: string
    headline: string
    mapNote: string
    directions: string
    /** 길찾기 링크로 내보낼 지도 서비스. 한국 사용자는 카카오·네이버를 더 많이 쓴다. */
    mapProviders: { id: "google" | "kakao" | "naver"; label: string }[]
  }
  products: ProductFamily[]
  productsPage: {
    pageTitle: string
    breadcrumb: string
    sampleCta: string
    inquiryCta: string
    imageNote: string
    faqTitle: string
    faq: { q: string; a: string }[]
  }
  news: {
    pageTitle: string
    breadcrumb: string
    headline: string
    description: string
    /** 기사 상세의 이전/다음 글 · 원문 링크 라벨 */
    prevPost: string
    nextPost: string
    backToList: string
    readOriginal: string
    items: NewsItem[]
  }
  library: {
    pageTitle: string
    breadcrumb: string
    headline: string
    disclaimer: string
    items: LibraryItem[]
  }
  contact: {
    pageTitle: string
    breadcrumb: string
    headline: string
    description: string
    form: {
      name: string
      namePlaceholder: string
      organization: string
      organizationPlaceholder: string
      email: string
      emailPlaceholder: string
      phone: string
      phonePlaceholder: string
      topic: string
      topicOptions: { value: string; label: string }[]
      message: string
      messagePlaceholder: string
      consent: string
      submit: string
      submitting: string
      successTitle: string
      successBody: string
      reset: string
      required: string
      invalidEmail: string
    }
  }
  footer: {
    tagline: string
    columns: { title: string; links: NavChild[] }[]
    legal: string[]
    copyright: string
    terms: string
    privacy: string
  }
}

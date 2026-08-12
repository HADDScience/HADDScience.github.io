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

export interface NewsItem {
  id: string
  date: string
  title: string
  image: string
  href: string
  /**
   * 카드뉴스 이미지 경로. 이 배열이 있으면 사이트 안에 상세 페이지(`/news/<id>`)가 생기고,
   * 없으면 `href` 가 아임웹 원본 게시글을 가리킨다.
   * 아임웹 뉴스 게시글은 본문이 전부 1024×1024 카드뉴스 이미지이고 텍스트가 없다.
   */
  cards?: string[]
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

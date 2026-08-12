import type { SiteContent } from "./types"

/**
 * 콘텐츠 출처: haddscience.com (2026-08-07 크롤링).
 * 카피는 실제 사이트에서 그대로 옮겼다. 예외는 주석으로 표시.
 */
export const ko: SiteContent = {
  meta: {
    lang: "ko",
    title: "하드사이언스 | 3D 세포배양의 새로운 기준",
    description:
      "하드사이언스는 자연유래 폴리핵산 젤 기술을 기반으로 3D 세포배양 소재 ADDGEL과 LiVEGEL을 개발합니다.",
  },

  company: {
    nameKo: "하드사이언스",
    nameEn: "HADD SCIENCE",
    slogan: "ADD the values to Human life.",
    ceo: "허채정",
    businessNumber: "503-52-46329",
    tel: "+82 31 8055 3780",
    fax: "031 375 4782",
    email: "info@haddscience.com",
    ceoEmail: "neuroheo@haddscience.com",
    workingTime: "09:00 ~ 18:00",
    locations: [
      {
        kind: "본사",
        name: "수원대학교 고운첨단과학기술원",
        address: "경기도 화성시 봉담읍 와우안길 17, 수원대학교 고운첨단과학기술원 5층 505호",
      },
      {
        kind: "연구협력기관",
        name: "성균관대학교 Branics Lab",
        address: "성균관대학교 자연과학캠퍼스 N센터 6층 Branics Lab",
      },
      {
        kind: "연구소",
        name: "경기바이오센터 랩스테이션",
        address: "경기도 수원시 영통구 광교로 147, 경기바이오센터 8층 랩스테이션 8B",
      },
    ],
  },

  nav: [
    {
      label: "ABOUT",
      href: "/about",
      children: [
        { label: "하드사이언스", href: "/about" },
        { label: "팀:하드", href: "/about/team" },
        { label: "위치", href: "/about/location" },
      ],
    },
    {
      label: "PRODUCT",
      href: "/products",
      children: [
        { label: "ADDGEL", href: "/products" },
        { label: "LiVEGEL", href: "/products/livegel" },
      ],
    },
    { label: "NEWS", href: "/news", children: [{ label: "뉴스", href: "/news" }] },
    {
      label: "HADD:LIBRARY",
      href: "/library",
      children: [{ label: "하드:라이브러리", href: "/library" }],
    },
  ],
  navCta: "문의하기",

  ui: {
    menu: "메뉴",
    languageSelect: "언어 선택",
    languageNotReady: "해당 언어는 준비 중입니다.",
    pagination: "페이지",
    prevPage: "이전 페이지",
    nextPage: "다음 페이지",
    viewDetail: "자세히 보기",
    storage: "보관",
    intendedUse: "용도",
    sampleAvailable: "샘플 신청 가능",
    sampleUnavailable: "샘플 신청 불가",
    mainLine: "대표번호",
    fax: "팩스",
    inquirySubjectPrefix: "홈페이지 문의",
  },

  legal: {
    breadcrumb: "LEGAL",
    termsHeading: "약관 전문 이관 필요",
    termsBody:
      "현재 운영 중인 사이트의 이용약관 원문을 그대로 옮겨 주세요. 법적 효력이 있는 문서이므로 임의로 작성하지 않았습니다.",
    privacyHeading: "처리방침 전문 이관 필요",
    privacyBody:
      "문의 폼에서 이름 · 이메일 · 연락처를 수집하므로, 공개 전에 현재 사이트의 개인정보처리방침 원문을 반드시 옮겨야 합니다. 법적 효력이 있는 문서이므로 임의로 작성하지 않았습니다.",
  },

  home: {
    heroSlides: [
      {
        // 실제 사이트 히어로에는 "세로운" 오타가 있다. About 페이지의 동일 문장을 따라 "새로운"으로 수정했다.
        title: ["과학은 실험에서", "혁신은 사람에게서 시작됩니다."],
        description: ["17년간의 연구, 그리고 지금", "세포배양의 새로운 기준을 만듭니다."],
      },
      {
        eyebrow: "LiVEGEL",
        title: ["간편하게 넣고, 바로 배양!", "액상형 3D 세포배양의 새로운 기준"],
        description: [
          "별도 준비 없이 바로 사용 가능한 액상형 배지,",
          "LiVEGEL로 더 빠르고 간편한 3D 배양을 경험하세요.",
        ],
        cta: { label: "라이브젤 자세히 보기", href: "/products/livegel" },
        image: "/products/livegel.webp",
      },
      {
        eyebrow: "ADDGEL",
        title: ["내가 쓰는 배양액을 젤타입으로!", "가장 쉽고 빠르게 3차원 배양을 만나보세요!"],
        description: [
          "3가지 타입의 간편한 솔루션으로 빠른 준비, 최소한의 오염, 최대의 효율을 제공합니다.",
          "샘플 홀딩부터 회수까지 원스텝으로, 연구에만 집중하세요.",
        ],
        cta: { label: "애드젤 자세히 보기", href: "/products" },
        image: "/products/addgel-syringe.webp",
      },
    ],
    stats: [
      { value: "17", suffix: "년", label: "3D 세포배양 · 바이오 소재 연구" },
      { value: "3", suffix: "Forms", label: "Syringe · Bottle · Lyophilized" },
      { value: "3", suffix: "곳", label: "본사 · 연구협력기관 · 연구소" },
      { value: "2024", label: "하드사이언스 설립" },
    ],
    productSection: {
      eyebrow: "Gel-type culture media",
      title: "Culture matrix for 3D cell culture.",
      heading: "ADDGEL — Three forms, one powerful 3D culture solution",
      cta: "전체 제품 보기",
    },
    newsSection: {
      eyebrow: "Newsroom",
      title: "뉴스",
      description: "하드사이언스의 소식과 보도자료를 전합니다.",
      cta: "더 보기",
    },
    aboutSection: {
      eyebrow: "About",
      title: "ADD the Values to Human Life",
      body: [
        "바이오테크놀로지와 생명과학 분야에서 도전을 이어가는 젊은 스타트업입니다.",
        "최첨단 기술과 창의적인 접근으로 인류 건강을 위한 배양액 솔루션을 개발하며, 전 세계에 긍정적인 변화를 목표로 하고 있습니다.",
      ],
      cta: "회사 소개 보기",
    },
    partners: {
      eyebrow: "Partners",
      title: "함께 만드는 기술의 미래",
      description: "하드사이언스의 파트너들입니다.",
    },
    ctaBand: {
      tag: "Sample request",
      title: "연구에 맞는 제형을 함께 찾아드립니다.",
      description: "배양하시려는 세포와 용도를 알려주시면 샘플과 프로토콜을 안내해 드립니다.",
      cta: "샘플 문의하기",
    },
  },

  about: {
    pageTitle: "하드사이언스",
    breadcrumb: "ABOUT",
    headline: "ADD the values to Human life.",
    lead: [
      "과학은 실험에서, 혁신은 사람에게서 시작됩니다.",
      "17년간의 연구, 그리고 지금.",
      "우리는 세포배양의 새로운 기준을 만듭니다.",
    ],
    story: {
      title: "HADD Story",
      body: [
        "매일 수많은 실험이 반복되는 연구실에서, 우리는 늘 ‘더 나은 배양 환경’을 고민했습니다.",
        "단지 제품이 아닌, 연구자와 함께 호흡하는 솔루션이 필요했습니다.",
        "그래서 우리는 하드사이언스를 만들었습니다.",
      ],
    },
    whatWeDo: {
      title: "What We Do",
      // 원문은 항목마다 이모지를 달고 있으나 디자인시스템이 이모지를 금지하므로 번호 라벨로 대체했다.
      items: [
        { index: "01", title: "ADDGEL 개발 및 공급", description: "3D 세포배양젤 ADDGEL을 개발하고 공급합니다." },
        { index: "02", title: "바이오소재 연구", description: "바이오소재를 연구하고 신제품을 기획합니다." },
        { index: "03", title: "연구자와의 협업", description: "연구자와 협업하며 맞춤형 실험을 지원합니다." },
      ],
    },
    team: {
      title: "Our Team",
      quote: "실험실에서 시작된, 진짜 연구팀",
      cta: "팀 보러가기",
    },
    culture: {
      title: "Collab & Culture",
      values: ["함께 성장하는 팀워크", "좋은 실험은, 좋은 협업에서", "실험 실패 OK, 포기 NO"],
    },
    cta: {
      title: "당신의 실험을 한 단계 더 진화시키고 싶다면,",
      description: "지금 하드사이언스를 만나보세요.",
      label: "우리의 제품 보러가기",
    },
  },

  team: {
    pageTitle: "팀 : 하드",
    breadcrumb: "ABOUT",
    headline: ["셀 연구의 달인들 :", "팀 하드사이언스"],
    intro: [
      "우리는 3D 세포배양 솔루션을 혁신하는 팀, 하드사이언스(HADD SCIENCE)입니다.",
      "자연유래 폴리핵산 젤 기술을 기반으로 차세대 바이오 소재 ‘애드젤(ADDGEL)’을 개발하며, 연구자들에게 더 나은 배양 환경을 제공합니다.",
    ],
    members: [
      {
        role: "CEO · CTO",
        name: "Neuro H",
        specialty: "바이오 신소재 연구 & 사업화 전문가",
        bio: "17년간 3D 세포배양 및 바이오 소재 연구를 수행하며, 연구실에서 상용화까지 이어지는 바이오 혁신의 길을 개척하고 있습니다. 과학과 비즈니스, 두 영역을 잇는 리더.",
        photo: "/team/neuro-h.webp",
      },
      {
        role: "CMO",
        name: "KH",
        specialty: "바이오 업계 16년 경력 · 연구소 · 제약 · 병원 영업 전문가",
        bio: "기술이 뛰어나도 시장에서 인정받지 못하면 무용지물! 연구자들과의 네트워크를 바탕으로 애드젤의 글로벌 시장 확장을 이끌어갑니다.",
        photo: "/team/kh.webp",
      },
      {
        role: "CAO",
        name: "YH",
        specialty: "바이오 & AI 기반 마케팅 전략가",
        bio: "13년간 바이오 업계에서 마케팅과 기술지원을 수행하며, AI 분석 경험까지 겸비한 다재다능한 전문가. 연구자들에게 애드젤의 가치를 제대로 전달하는 것이 목표입니다.",
        photo: "/team/yh.webp",
      },
      {
        role: "R&D Leader",
        name: "Ari",
        specialty: "바이오메디컬 엔지니어링 박사 · 3D 세포배양 전문가",
        bio: "10년 이상 줄기세포 배양 및 바이오소재 연구를 수행한 핵심 기술 인력. 애드젤의 기능 최적화 & 차세대 제품 개발을 책임지고 있습니다.",
        photo: "/team/ari.webp",
      },
      {
        role: "Technical Support & Regulatory Team Leader",
        name: "Noh",
        specialty: "약학 석사 · 실험 · 인증 전문가",
        bio: "의료기관 및 연구소 경험을 바탕으로, 제품의 인증·학술·시제품 개발을 총괄. 과학적 근거 기반의 신뢰할 수 있는 제품을 만듭니다.",
        photo: "/team/noh.webp",
      },
      {
        role: "Manufacturing & Certification Researcher",
        name: "박소정",
        specialty: "공학 석사 · 인증 · 제품화 연구원",
        bio: "경희대학교 공학석사 출신으로, 합성생물학 및 나노재료공정 연구를 수행하며 제품 인증과 제품화 프로세스를 전담합니다.",
        photo: "/team/sojeong-park.webp",
      },
      {
        role: "AI Solutions Developer",
        name: "정우창",
        // 라이브 사이트는 정우창·주용석의 설명이 서로 바뀌어 있다(2026-08-12 확인). 여기서 바로잡았다.
        // 직함이 사원(AI Solutions Developer)이므로 원문의 "학부 인턴으로," 는 뺐다.
        specialty: "AI 전문인력양성 · Agent AI · SW 개발",
        bio: "Agent AI 및 SW 개발을 중심으로 활동하며 바이오 데이터 기반 AI 솔루션 구현을 담당합니다.",
        photo: "/team/woochang-jung.webp",
      },
      {
        role: "AI Development Intern",
        name: "주용석",
        specialty: "AI 전문인력양성 · ML/DL · Multi-modal",
        bio: "학부 인턴으로, ML/DL 모델링과 Multi-modal Modeling을 중점적으로 연구하며 바이오 데이터 분석 및 정보 조사를 지원합니다.",
        photo: "/team/yongseok-ju.webp",
      },
    ],
  },

  location: {
    pageTitle: "위치",
    breadcrumb: "ABOUT",
    headline: "본사 및 연구소",
  },

  products: [
    {
      id: "addgel",
      name: "ADDGEL",
      eyebrow: "Gel-type culture media",
      tagline: "culture matrix for 3D cell culture.",
      heading: "ADDGEL — Three forms, one powerful 3D culture solution",
      description: "기존 매트리젤 / 하이드로젤을 대체하는 3D 세포배양용 배지 조성물",
      regulatory: "For research use only",
      href: "/products",
      variants: [
        {
          id: "syringe",
          name: "ADDGEL",
          form: "Syringe type",
          image: "/products/addgel-syringe.webp",
          storage: "2°C ~ 8°C",
          sampleRequest: true,
          sampleNote: "샘플 신청 버튼을 누르신 후 양식을 작성하시면 샘플 신청이 가능합니다.",
        },
        {
          id: "bottle",
          name: "ADDGEL",
          form: "Bottle type",
          image: "/products/addgel-bottle.webp",
          storage: "2°C ~ 8°C",
          sampleRequest: true,
          sampleNote: "샘플 신청 버튼을 누르신 후 양식을 작성하시면 샘플 신청이 가능합니다.",
        },
        {
          id: "lyophilized",
          name: "ADDGEL",
          form: "Lyophilized type",
          image: "/products/addgel-lyophilized.webp",
          storage: "실온 15°C ~ 25°C",
          sampleRequest: false,
          sampleNote: "현재 해당 제품은 샘플 신청이 불가능합니다.",
        },
      ],
    },
    {
      id: "livegel",
      name: "LiVEGEL",
      eyebrow: "Ready-to-use liquid culture media",
      tagline: "for advanced 3D cell culture.",
      heading: "LiVEGEL — Simply add, instantly culture in 3D",
      description: "기존 매트리젤 / 하이드로젤을 대체하는 3D 세포배양용 배지 조성물",
      regulatory: "For research use only",
      href: "/products/livegel",
      variants: [
        {
          id: "livegel-1ml",
          name: "LiVEGEL",
          form: "1ml Dropper",
          image: "/products/livegel.webp",
          storage: "2°C ~ 8°C",
          sampleRequest: true,
          sampleNote: "샘플 신청 버튼을 누르신 후 양식을 작성하시면 샘플 신청이 가능합니다.",
        },
      ],
    },
  ],

  productsPage: {
    pageTitle: "PRODUCT",
    breadcrumb: "PRODUCT",
    sampleCta: "샘플 신청",
    inquiryCta: "가격 문의",
    imageNote: "제품 이미지를 클릭하시면 정보를 확인하실 수 있습니다.",
    faqTitle: "자주 묻는 질문 (FAQ)",
    faq: [
      {
        q: "기존에 쓰던 배양액을 그대로 사용할 수 있나요?",
        a: "네. ADDGEL은 연구자가 사용 중인 액상 배지를 그대로 배양 젤로 전환하도록 설계되어 있습니다. 새로운 배지나 별도의 시스템을 도입할 필요가 없습니다.",
      },
      {
        q: "보관 조건은 어떻게 되나요?",
        a: "Syringe type과 Bottle type은 2°C ~ 8°C 냉장 보관, Lyophilized type은 실온(15°C ~ 25°C) 보관입니다.",
      },
      {
        q: "샘플을 받아볼 수 있나요?",
        a: "Syringe type, Bottle type, LiVEGEL은 샘플 신청이 가능합니다. Lyophilized type은 현재 샘플 신청을 받지 않습니다. 문의하기에서 배양하시려는 세포와 용도를 알려주시면 안내해 드립니다.",
      },
      {
        q: "임상이나 진단 목적으로 사용할 수 있나요?",
        a: "아니요. 모든 제품은 연구용(For research use only)입니다.",
      },
    ],
  },

  news: {
    pageTitle: "뉴스",
    breadcrumb: "NEWS",
    headline: "News & Media",
    description: "하드사이언스의 소식과 보도자료입니다.",
    items: [],
  },

  library: {
    pageTitle: "하드:라이브러리",
    breadcrumb: "HADD:LIBRARY",
    headline: "HADD:Library",
    disclaimer:
      "기사 요약은 실제 뉴스 출처를 기반으로 하며, 이미지는 이해를 돕기 위해 AI로 생성한 것입니다.",
    items: [
      {
        date: "2026.06.20",
        title: "장과 신장을 동시에 막았더니… 12주 만에 혈당 지표가 1%p 가까이 떨어졌다",
        excerpt:
          "제일약품 JP-2266, 제2형 당뇨병 2상에서 위약 대비 HbA1c 0.94~0.97%p 감소. 제일약품이 개발한 JP-2266은 장의 SGLT1과 신장의 SGLT2를 함께 억제하는 경구용 당뇨병 후보물질이다.",
      },
      {
        date: "2026.06.20",
        title: "한국 임상시험, 이제 진짜 글로벌 판으로 간다… 정부가 꺼낸 새 카드",
        excerpt:
          "보건복지부와 국가임상시험지원재단은 6월 20일 ‘2026 세계 임상시험의 날’ 기념행사를 열고, 올해 핵심 메시지로 글로벌 임상시험 협력을 전면에 내세웠다.",
      },
      {
        date: "2026.06.20",
        title: "삼성·셀트리온·SK 총출동… 샌디에이고에서 벌어질 K-바이오 빅딜 전쟁",
        excerpt: "K-바이오, BIO USA 2026 총집결… 기술수출·수주 총력전.",
      },
      {
        date: "2026.06.20",
        title: "모더나, 독감백신까지 뚫나… mRNA 2막이 진짜 시작됐다",
        excerpt:
          "미국 FDA 자문위원회는 6월 18일 모더나의 계절성 독감백신 mFlusiva에 대해 50세 이상 성인에서 편익이 위험을 상회한다고 판단했다.",
      },
      {
        date: "2026.06.08",
        title:
          "광교 바이오 랩 스테이션이 ‘진짜 사고’를 쳤다… 동물대체시험법 시장에 K-스타트업이 던진 카드",
        excerpt:
          "비임상 CRO 코아스템켐온과 바이오 스타트업 HADD Science가 6월 4일 ‘미래 오가노이드 플랫폼 구축’을 위한 공동연구개발 협약을 체결했다.",
      },
      {
        date: "2026.06.01",
        title: "사망위험 60%↓, 종양 33% 통제… ASCO 2026이 처음 본 새 RAS(ON) 시대",
        excerpt:
          "5월 31일 ASCO 2026에서 Revolution Medicines는 췌장암 신약 daraxonrasib의 500명 후기 임상 결과를 공개했다.",
      },
    ],
  },

  contact: {
    pageTitle: "CONTACT",
    breadcrumb: "SUPPORT",
    headline: "문의하기",
    description: "제품 문의 및 협력 · 투자 관련 사항 등 자유로운 문의가 가능합니다.",
    form: {
      name: "이름",
      namePlaceholder: "홍길동",
      organization: "소속",
      organizationPlaceholder: "○○대학교 ○○연구실",
      email: "이메일",
      emailPlaceholder: "researcher@example.ac.kr",
      phone: "연락처",
      phonePlaceholder: "010-0000-0000",
      topic: "문의 유형",
      topicOptions: [
        { value: "sample", label: "샘플 신청" },
        { value: "pricing", label: "가격 문의" },
        { value: "technical", label: "기술 문의" },
        { value: "partnership", label: "협력 · 투자" },
        { value: "etc", label: "기타" },
      ],
      message: "문의 내용",
      messagePlaceholder:
        "배양하시려는 세포와 용도를 알려주시면 더 정확하게 안내해 드릴 수 있습니다.",
      consent: "개인정보 수집 및 이용에 동의합니다.",
      submit: "문의 보내기",
      submitting: "보내는 중…",
      successTitle: "문의가 접수되었습니다.",
      successBody: "영업일 기준 1~2일 내에 담당자가 회신드립니다.",
      reset: "새 문의 작성",
      required: "필수 항목입니다.",
      invalidEmail: "이메일 형식이 올바르지 않습니다.",
    },
  },

  footer: {
    tagline: "ADD the values to Human life.",
    columns: [
      {
        title: "ABOUT",
        links: [
          { label: "하드사이언스", href: "/about" },
          { label: "팀:하드", href: "/about/team" },
          { label: "위치", href: "/about/location" },
        ],
      },
      {
        title: "PRODUCT",
        links: [
          { label: "ADDGEL", href: "/products" },
          { label: "LiVEGEL", href: "/products/livegel" },
        ],
      },
      {
        title: "NEWS",
        links: [
          { label: "뉴스", href: "/news" },
          { label: "하드:라이브러리", href: "/library" },
        ],
      },
    ],
    legal: [
      "상호명: 하드사이언스 (HADDSCIENCE)",
      "대표자: 허채정",
      "사업자등록번호: 503-52-46329",
      "대표자 이메일: neuroheo@haddscience.com",
    ],
    copyright: "Copyright © 2026 HADD Science. All rights reserved.",
    terms: "이용약관",
    privacy: "개인정보처리방침",
  },
}

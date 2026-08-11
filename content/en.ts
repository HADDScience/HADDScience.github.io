import type { SiteContent } from "./types"

/**
 * 영문 콘텐츠.
 *
 * 출처 우선순위
 * 1. haddeng.imweb.me 에 이미 존재하는 영문 원문을 그대로 사용 (About, Team, Location,
 *    Product 헤드라인, Collab & Culture 등). 원문 표기를 임의로 다듬지 않았다.
 * 2. 원문이 없는 부분만 한국어에서 번역 (히어로, 폼 라벨, 뉴스 제목 등).
 *
 * 이미지에 구워진 텍스트(제품 라벨, 로고, 뉴스 썸네일)는 번역 대상에서 제외했다.
 */
export const en: SiteContent = {
  meta: {
    lang: "en",
    title: "HADD Science | A new standard in 3D cell culture",
    description:
      "HADD Science develops ADDGEL and LiVEGEL, 3D cell culture materials built on natural polynucleotide hydrogel technology.",
  },

  company: {
    nameKo: "하드사이언스",
    nameEn: "HADD SCIENCE",
    slogan: "ADD the values to Human life.",
    ceo: "Chaejung Heo",
    businessNumber: "503-52-46329",
    tel: "+82 31 8055 3780",
    fax: "+82 31 375 4782",
    email: "info@haddscience.com",
    ceoEmail: "neuroheo@haddscience.com",
    workingTime: "09:00 – 18:00 (KST)",
    locations: [
      {
        kind: "Head Office",
        name: "Gowoon Advanced Institute of Science and Technology",
        address:
          "Room 505, 5F, Gowoon Advanced Institute of Science and Technology, The University of Suwon, 17 Wauan-gil, Bongdam-eup, Hwaseong-si, Gyeonggi-do, Republic of Korea",
      },
      {
        kind: "Research Collaboration Center",
        name: "Branics Lab, Sungkyunkwan University",
        address:
          "Branics Lab, 6F, N Center, Natural Science Campus, Sungkyunkwan University, Suwon, Gyeonggi-do, Republic of Korea",
      },
      {
        kind: "Research Institute",
        name: "Gyeonggi Bio Center Lab Station",
        address:
          "Lab Station 8B, 8F, Gyeonggi Bio Center, 147 Gwanggyo-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do, Republic of Korea",
      },
    ],
  },

  nav: [
    {
      label: "ABOUT",
      href: "/about",
      children: [
        { label: "HADD SCIENCE", href: "/about" },
        { label: "TEAM: HADD", href: "/about/team" },
        { label: "Location", href: "/about/location" },
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
    { label: "NEWS", href: "/news", children: [{ label: "NEWS", href: "/news" }] },
    {
      label: "HADD:LIBRARY",
      href: "/library",
      children: [{ label: "LIBRARY", href: "/library" }],
    },
  ],
  navCta: "Contact us",

  ui: {
    menu: "Menu",
    languageSelect: "Select language",
    languageNotReady: "This language is not available yet.",
    pagination: "Pagination",
    prevPage: "Previous page",
    nextPage: "Next page",
    viewDetail: "View details",
    storage: "Storage",
    intendedUse: "Use",
    sampleAvailable: "Sample available",
    sampleUnavailable: "Sample unavailable",
    mainLine: "Tel",
    fax: "Fax",
    inquirySubjectPrefix: "Website enquiry",
  },

  legal: {
    breadcrumb: "LEGAL",
    termsHeading: "Terms text still to be migrated",
    termsBody:
      "Please copy the terms and conditions from the site currently in operation. This is a legally binding document, so no wording has been drafted here.",
    privacyHeading: "Privacy policy text still to be migrated",
    privacyBody:
      "The contact form collects a name, email address and phone number, so the privacy policy from the current site must be migrated before launch. This is a legally binding document, so no wording has been drafted here.",
  },

  home: {
    heroSlides: [
      {
        title: ["Science begins with experiments.", "Innovation begins with people."],
        description: [
          "Powered by 17 years of research, and now —",
          "creating a new standard in cell culture.",
        ],
      },
      {
        eyebrow: "LiVEGEL",
        title: ["Simply add, culture instantly.", "A new standard in liquid 3D cell culture"],
        description: [
          "A ready-to-use liquid medium that needs no preparation.",
          "Experience faster, simpler 3D culture with LiVEGEL.",
        ],
        cta: { label: "Explore LiVEGEL", href: "/products/livegel" },
        image: "/products/livegel.webp",
      },
      {
        eyebrow: "ADDGEL",
        title: ["Turn your own medium into a gel.", "The fastest, easiest route to 3D culture."],
        description: [
          "Three simple formats deliver fast setup, minimal contamination and maximum efficiency.",
          "From sample holding to recovery in one step — stay focused on the research.",
        ],
        cta: { label: "Explore ADDGEL", href: "/products" },
        image: "/products/addgel-syringe.webp",
      },
    ],
    stats: [
      { value: "17", suffix: "yrs", label: "3D cell culture & biomaterials research" },
      { value: "3", suffix: "Forms", label: "Syringe · Bottle · Lyophilized" },
      { value: "3", suffix: "sites", label: "Head office · Collaboration center · Institute" },
      { value: "2024", label: "HADD Science founded" },
    ],
    productSection: {
      eyebrow: "Gel-type culture media",
      title: "Culture matrix for 3D cell culture.",
      heading: "ADDGEL — Three forms, one powerful 3D culture solution",
      cta: "View all products",
    },
    newsSection: {
      eyebrow: "Newsroom",
      title: "News",
      description: "Updates and press coverage from HADD Science.",
      cta: "See more",
    },
    aboutSection: {
      eyebrow: "About",
      title: "ADD the Values to Human Life",
      body: [
        "We are a young startup taking on the challenges of biotechnology and life sciences.",
        "With advanced technology and a creative approach, we develop culture media solutions for human health, aiming to make a positive difference worldwide.",
      ],
      cta: "About the company",
    },
    partners: {
      title: "Building the future of technology together",
      description: "These are the partners of HADD Science.",
    },
    ctaBand: {
      tag: "Sample request",
      title: "We will help you find the right format for your research.",
      description:
        "Tell us which cells you are culturing and what you need them for, and we will guide you to a sample and protocol.",
      cta: "Request a sample",
    },
  },

  about: {
    pageTitle: "HADD SCIENCE",
    breadcrumb: "ABOUT",
    headline: "ADD the values to Human life.",
    lead: [
      "Science begins with experiments. Innovation begins with people.",
      "Powered by 17 years of research and experience.",
      "Creating a new standard in cell culture.",
    ],
    story: {
      title: "HADD Story",
      body: [
        "In laboratories where countless experiments take place every day, we have always been driven by one mission: to create a better environment for cell culture.",
        "We believed researchers needed more than just a product — they needed a solution that understands their work and advances with them.",
        "That’s why we founded HADD Science.",
      ],
    },
    whatWeDo: {
      title: "What We Do",
      items: [
        {
          index: "01",
          title: "ADDGEL development and supply",
          description:
            "Development and supply of ADDGEL, an advanced 3D cell culture hydrogel.",
        },
        {
          index: "02",
          title: "Biomaterials research",
          description: "Biomaterials research and innovative product development.",
        },
        {
          index: "03",
          title: "Research partnerships",
          description:
            "Collaborative research partnerships and customized experimental support.",
        },
      ],
    },
    team: {
      title: "Our Team",
      quote: "Created in the Lab. Inspired by Researchers.",
      cta: "Meet the team",
    },
    culture: {
      title: "Collab & Culture",
      values: [
        "We Grow Together.",
        "Great Science Comes from Great Collaboration.",
        "Failure Is Part of Research. Giving Up Is Not.",
      ],
    },
    cta: {
      title: "Ready to advance your research?",
      description: "Discover HADD Science today.",
      label: "See our products",
    },
  },

  team: {
    pageTitle: "TEAM: HADD",
    breadcrumb: "ABOUT",
    headline: ["The Masters of Cell Research:", "Team HADD Science"],
    intro: [
      "At HADD Science, we are redefining the future of 3D cell culture.",
      "Built on our proprietary natural polynucleotide hydrogel technology, we develop ADDGEL, an innovative next-generation biomaterial designed to provide researchers with a better, more physiologically relevant cell culture environment.",
    ],
    members: [
      {
        role: "CEO · CTO",
        name: "Neuro H",
        specialty: "Biomaterials Research & Commercialization Specialist",
        bio: "With 17 years of expertise in 3D cell culture and biomaterials research, she has been transforming scientific discoveries into real-world innovations, bridging the worlds of science and business with vision and leadership.",
      },
      {
        role: "CMO",
        name: "KH",
        specialty:
          "16+ Years in Bio & Research · Pharmaceutical · Hospital Sales Experience",
        bio: "Great technology only creates value when it reaches the market. Leveraging a strong network of researchers and industry partners, he is leading the global expansion and commercialization of ADDGEL.",
      },
      {
        role: "CAO",
        name: "YH",
        specialty: "Bio & AI-Driven Marketing Strategist",
        bio: "With 13 years of experience in biopharma marketing and technical support, he combines scientific expertise with AI-driven analytics to connect innovation with researchers. His mission is to bring the value of ADDGEL to the global scientific community.",
      },
      {
        role: "R&D Leader",
        name: "Ari",
        specialty: "Ph.D. in Biomedical Engineering · 3D Cell Culture & Biomaterials Expert",
        bio: "With over 10 years of experience in stem cell culture and biomaterials research, he leads the optimization of ADDGEL and spearheads the development of next-generation biomaterial solutions.",
      },
      {
        role: "Technical Support & Regulatory Team Leader",
        name: "Noh",
        specialty:
          "M.S. in Pharmaceutical Sciences · Laboratory & Regulatory Affairs Specialist",
        bio: "Leveraging experience across healthcare and research institutions, he drives product validation, scientific affairs, and prototype development — building trusted solutions backed by scientific evidence.",
      },
      {
        role: "Manufacturing & Certification Researcher",
        name: "Sojeong Park",
        specialty: "M.Eng. · Certification & Productization Researcher",
        bio: "Holding a master’s degree in engineering from Kyung Hee University, she conducts synthetic biology and nanomaterial process research, and owns product certification and productization processes.",
      },
      {
        role: "AI Solutions Developer",
        name: "Woochang Jung",
        specialty: "AI Talent Program · ML/DL · Multi-modal",
        bio: "As an undergraduate research intern, he specializes in ML/DL and multimodal AI modeling, supporting biomedical data analysis and scientific research through AI-driven approaches.",
      },
      {
        role: "AI Development Intern",
        name: "Yongseok Ju",
        specialty: "AI Talent Program · Agentic AI · Software Engineering",
        bio: "As an undergraduate research intern, he specializes in Agentic AI and software development, developing AI-powered solutions built on biomedical data.",
      },
    ],
  },

  location: {
    pageTitle: "Location",
    breadcrumb: "ABOUT",
    headline: "Head Office & Research Institute",
  },

  products: [
    {
      id: "addgel",
      name: "ADDGEL",
      eyebrow: "Gel-type culture media",
      tagline: "culture matrix for 3D cell culture.",
      heading: "ADDGEL — Three forms, one powerful 3D culture solution",
      description:
        "A 3D cell culture medium composition that replaces conventional Matrigel and hydrogels.",
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
          sampleNote:
            "Press the sample request button and complete the form to request a sample.",
        },
        {
          id: "bottle",
          name: "ADDGEL",
          form: "Bottle type",
          image: "/products/addgel-bottle.webp",
          storage: "2°C ~ 8°C",
          sampleRequest: true,
          sampleNote:
            "Press the sample request button and complete the form to request a sample.",
        },
        {
          id: "lyophilized",
          name: "ADDGEL",
          form: "Lyophilized type",
          image: "/products/addgel-lyophilized.webp",
          storage: "Room temperature 15°C ~ 25°C",
          sampleRequest: false,
          sampleNote: "Sample requests are not available for this product at this time.",
        },
      ],
    },
    {
      id: "livegel",
      name: "LiVEGEL",
      eyebrow: "Ready-to-use liquid culture media",
      tagline: "for advanced 3D cell culture.",
      heading: "LiVEGEL — Simply add, instantly culture in 3D",
      description:
        "A 3D cell culture medium composition that replaces conventional Matrigel and hydrogels.",
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
          sampleNote:
            "Press the sample request button and complete the form to request a sample.",
        },
      ],
    },
  ],

  productsPage: {
    pageTitle: "PRODUCT",
    breadcrumb: "PRODUCT",
    sampleCta: "Request a sample",
    inquiryCta: "Pricing inquiry",
    imageNote: "Click a product image to see more information.",
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "Can I keep using the culture medium I already work with?",
        a: "Yes. ADDGEL is designed to convert the liquid medium you already use into a culture gel. There is no need to adopt a new medium or install a new system.",
      },
      {
        q: "How should the products be stored?",
        a: "Syringe type and Bottle type are refrigerated at 2°C ~ 8°C. Lyophilized type is stored at room temperature (15°C ~ 25°C).",
      },
      {
        q: "Can I get a sample?",
        a: "Samples are available for Syringe type, Bottle type and LiVEGEL. Lyophilized type is not available for sampling at this time. Tell us which cells you are culturing and what you need them for on the contact page and we will follow up.",
      },
      {
        q: "Can the products be used for clinical or diagnostic purposes?",
        a: "No. All products are for research use only.",
      },
    ],
  },

  news: {
    pageTitle: "News",
    breadcrumb: "NEWS",
    headline: "News & Media",
    description: "Updates and press coverage from HADD Science.",
    items: [],
  },

  library: {
    pageTitle: "HADD:Library",
    breadcrumb: "HADD:LIBRARY",
    headline: "HADD:Library",
    disclaimer:
      "Article summaries are based on actual news sources. Images are AI-generated for illustrative purposes.",
    items: [
      {
        date: "2026.06.20",
        title:
          "Blocking the gut and the kidney at once — HbA1c fell by nearly one point in 12 weeks",
        excerpt:
          "Jeil Pharmaceutical’s JP-2266 lowered HbA1c by 0.94–0.97 points versus placebo in a Phase 2 type 2 diabetes trial. JP-2266 is an oral candidate that inhibits SGLT1 in the gut and SGLT2 in the kidney together.",
      },
      {
        date: "2026.06.20",
        title: "Korean clinical trials go global — the government’s new card",
        excerpt:
          "On 20 June the Ministry of Health and Welfare and KoNECT held their ‘2026 World Clinical Trials Day’ event, putting global clinical trial collaboration front and centre as this year’s core message.",
      },
      {
        date: "2026.06.20",
        title:
          "Samsung, Celltrion and SK all in — the K-bio big-deal battle heading for San Diego",
        excerpt: "K-bio converges on BIO USA 2026 for an all-out push on licensing and orders.",
      },
      {
        date: "2026.06.20",
        title: "Moderna takes on flu vaccines — the second act of mRNA has begun",
        excerpt:
          "On 18 June a US FDA advisory committee judged that the benefits of Moderna’s seasonal influenza vaccine mFlusiva outweigh its risks in adults aged 50 and over.",
      },
      {
        date: "2026.06.08",
        title:
          "A Gwanggyo bio lab station makes real noise — the card a K-startup played in the alternatives-to-animal-testing market",
        excerpt:
          "Non-clinical CRO Corestem Chemon and bio startup HADD Science signed a joint R&D agreement on 4 June to build a future organoid platform.",
      },
      {
        date: "2026.06.01",
        title:
          "60% lower mortality, 33% tumour control — ASCO 2026 sees the first new RAS(ON) era",
        excerpt:
          "At ASCO 2026 on 31 May, Revolution Medicines released late-stage results from 500 patients for its pancreatic cancer drug daraxonrasib.",
      },
    ],
  },

  contact: {
    pageTitle: "CONTACT",
    breadcrumb: "SUPPORT",
    headline: "Contact us",
    description:
      "Product enquiries, partnership and investment questions — anything is welcome.",
    form: {
      name: "Name",
      namePlaceholder: "Jane Doe",
      organization: "Organization",
      organizationPlaceholder: "University / Lab",
      email: "Email",
      emailPlaceholder: "researcher@example.edu",
      phone: "Phone",
      phonePlaceholder: "+82 10 0000 0000",
      topic: "Enquiry type",
      topicOptions: [
        { value: "sample", label: "Sample request" },
        { value: "pricing", label: "Pricing inquiry" },
        { value: "technical", label: "Technical question" },
        { value: "partnership", label: "Partnership · Investment" },
        { value: "etc", label: "Other" },
      ],
      message: "Message",
      messagePlaceholder:
        "Tell us which cells you are culturing and what you need them for, and we can give you a more precise answer.",
      consent: "I agree to the collection and use of my personal information.",
      submit: "Send enquiry",
      submitting: "Sending…",
      successTitle: "Your enquiry has been received.",
      successBody: "We will get back to you within one to two business days.",
      reset: "Write another enquiry",
      required: "This field is required.",
      invalidEmail: "Please enter a valid email address.",
    },
  },

  footer: {
    tagline: "ADD the values to Human life.",
    columns: [
      {
        title: "ABOUT",
        links: [
          { label: "HADD SCIENCE", href: "/about" },
          { label: "TEAM: HADD", href: "/about/team" },
          { label: "Location", href: "/about/location" },
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
          { label: "News", href: "/news" },
          { label: "HADD:Library", href: "/library" },
        ],
      },
    ],
    legal: [
      "Company: HADD SCIENCE",
      "CEO: Chaejung Heo",
      "Business Registration No.: 503-52-46329",
      "CEO email: neuroheo@haddscience.com",
    ],
    copyright: "Copyright © 2026 HADD Science. All rights reserved.",
    terms: "Terms and conditions",
    privacy: "Privacy policy",
  },
}

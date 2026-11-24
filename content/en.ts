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
    title: "HADD SCIENCE | Organoid & 3D cell culture biomaterials",
    description:
      "HADD SCIENCE builds biomaterials for organoid and 3D cell culture on natural polynucleotide gel technology — the animal-free gel-type media supplement ADDGEL and the 3D organoid live imaging solution LiVEGEL, for research use.",
    // 한국어판과 같은 원칙: 화면에 실제로 있는 말만 적는다.
    keywords: [
      "HADD SCIENCE",
      "haddscience",
      "organoid",
      "organoid culture",
      "biomaterial",
      "3D cell culture",
      "gel-type media supplement",
      "hydrogel",
      "Matrigel alternative",
      "spheroid",
      "ADDGEL",
      "LiVEGEL",
    ],
    ogImageAlt: "HADD SCIENCE — organoid and 3D cell culture biomaterials",
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
        mapQuery: "경기도 화성시 봉담읍 와우안길 17 수원대학교 고운첨단과학기술원",
      },
      {
        kind: "Research Collaboration Center",
        name: "Branics Lab, Sungkyunkwan University",
        address:
          "Branics Lab, 6F, N Center, Natural Science Campus, Sungkyunkwan University, Suwon, Gyeonggi-do, Republic of Korea",
        mapQuery: "성균관대학교 자연과학캠퍼스 N센터",
      },
      {
        kind: "Research Institute",
        name: "Gyeonggi Bio Center Lab Station",
        address:
          "Lab Station 8B, 8F, Gyeonggi Bio Center, 147 Gwanggyo-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do, Republic of Korea",
        mapQuery: "경기도 수원시 영통구 광교로 147 경기바이오센터",
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
    { label: "CAREER", href: "/career", children: [{ label: "Open positions", href: "/career" }] },
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
    // 한글 쪽과 같은 말이다 — 브랜드 표기라 번역하지 않는다.
    pinned: "HADD PICK",
    mainLine: "Tel",
    fax: "Fax",
    inquirySubjectPrefix: "Website enquiry",
  },

  legal: {
    breadcrumb: "LEGAL",
    effectiveLabel: "Effective from",

    /**
     * 한국어판이 정본이다. 분쟁이 생기면 한국어판이 우선한다는 조항을 두 문서 모두에
     * 넣어 두었다 — 번역이 조항의 뜻을 바꿀 수 있기 때문이다.
     */
    // 2026-11-24 채용 지원을 넣었다. 근거와 범위는 `ko.ts` 의 privacy 주석과 같다.
    privacy: {
      effectiveFrom: "2026-11-24",
      intro:
        "HADD SCIENCE (\"the Company\") processes personal information collected through haddscience.com in accordance with the Personal Information Protection Act of the Republic of Korea and other applicable laws. This policy explains what we collect, why, how we handle it and when we delete it. Where this translation differs from the Korean version, the Korean version governs.",
      sections: [
        {
          title: "1. What we collect and why",
          paragraphs: [
            "There are three places on this site where we collect information about you: the contact form, the job application form and our visit statistics. There is no sign-up and no payment function, and we do not gather personal information by any other route.",
          ],
          table: {
            head: ["Source", "Items", "Purpose", "Retention"],
            rows: [
              [
                "Contact form (required)",
                "Name, email address, message",
                "Acknowledging and answering the enquiry",
                "3 years from the date received",
              ],
              [
                "Contact form (optional)",
                "Organization, phone number, enquiry type",
                "Reaching you, and advising on quotes and products",
                "3 years from the date received",
              ],
              [
                "Job application (required)",
                "Name, department, student ID, year, expected graduation, phone, email, résumé, motivation",
                "Selecting applicants and notifying them of the result",
                "Six months after selection closes; where no close of selection is set, 12 months from the date received",
              ],
              [
                "Job application (optional)",
                "Portfolio (file or link), tracks of interest",
                "Selecting applicants and placing interns",
                "Six months after selection closes; where no close of selection is set, 12 months from the date received",
              ],
              [
                "Collected automatically on submission",
                "IP address, browser information (User-Agent), time of submission",
                "Blocking bulk and duplicate submissions by automated programs",
                "3 years from the date received",
              ],
              [
                "Visit statistics (collected automatically)",
                "Page visited, language, device type (mobile or desktop), referring domain, visitor hash",
                "Understanding which pages are read and how often",
                "400 days from the date of the visit",
              ],
            ],
          },
        },
        {
          title: "2. About the visitor hash",
          paragraphs: [
            "The visitor hash in our visit statistics is derived from your IP address and browser information together with the current date. The IP address and browser information themselves are never stored — they are discarded the moment the hash is made, and they are not passed to our internal system.",
            "Because the date goes into the hash, the same person gets a different value once the day changes. We therefore cannot join yesterday's visits to today's, or follow one person's history across days. This site sets no cookie to recognise you.",
            "Use of the admin pages (/admin) is not counted.",
          ],
        },
        {
          title: "3. How enquiries and job applications are handled",
          paragraphs: [
            "An enquiry first lands in the inbox of the Company's internal system. Only after a member of staff has read it is it moved into our customer and quotation records. An enquiry that is never moved does not become a customer record, and it is deleted from the inbox once the retention period ends.",
            "If an enquiry leads to a quotation, the information is from that point held as the record of a trading counterparty and follows the periods in section 7.",
            "A job application is made by filling in the form on the job page and sending it from your own email program to the Company's mailbox (info@haddscience.com). What you type into the form passes through this site's server to be checked but is not stored there; your résumé and portfolio files are attached to the email directly and never pass through the server. Applications received are kept in the Company's mailbox and used by the hiring staff for selection only.",
            "If you are selected and start a placement or job, any information needed from then on is handled under a separate agreement or contract and consent. You may ask us to delete your application at any time before the retention period ends, and we will do so without delay.",
          ],
        },
        {
          title: "4. Disclosure to third parties",
          paragraphs: [
            "We do not disclose your personal information to third parties. The exception is where a law specifically requires it, or where an investigative authority requests it through the procedure that the law prescribes.",
          ],
        },
        {
          title: "5. Processors and transfer outside Korea",
          paragraphs: [
            "The Company does not run its own servers. It uses the providers below, and your enquiry is stored outside Korea as part of that arrangement.",
          ],
          table: {
            head: ["Recipient", "Work entrusted", "Items transferred", "Country of storage", "When and how"],
            rows: [
              [
                "Vercel Inc. (United States)",
                "Hosting the website and internal system, and serving requests",
                "Everything entered in the contact form and the job application form (application attachments excluded)",
                "United States — requests are served from the Seoul region. Vercel does not store the enquiry itself, but access logs (including the IP address) are retained.",
                "Sent over the network at the moment you submit the form",
              ],
              [
                "Neon Inc. (United States)",
                "Holding the enquiry and visit-statistics databases",
                "Everything entered in the contact form, plus the automatically collected items and the visit-statistics items",
                "Singapore",
                "Sent and stored at the moment the enquiry is received",
              ],
              [
                "NAVER Cloud Corp. (Republic of Korea)",
                "Running the Company's email (NAVER WORKS) — storing job applications and attachments received by email",
                "The application and attachments you send by email",
                "Republic of Korea",
                "Sent when you send the email, and stored in the Company's mailbox",
              ],
            ],
          },
          list: [
            "Retention by the recipient: until the Company ends the arrangement or deletes the information.",
            "You may refuse the transfer of your personal information outside Korea. To do so, contact us by phone or email (section 10) instead of using the form.",
            "An enquiry submitted through the form cannot be handled without this transfer, so if you refuse it you cannot use the form. Reaching us by any other means remains entirely open to you.",
            "You can also apply for a job without the form, by emailing the Company directly at info@haddscience.com.",
          ],
        },
        {
          title: "6. Deletion",
          paragraphs: [
            "We delete personal information without delay once the retention period has passed or the purpose has been fulfilled. Electronic records are deleted by a method that makes them unrecoverable.",
            "When the retention period for a job application ends, the hiring staff delete the email from the Company's mailbox and empty it from the trash as well. Any résumé or portfolio downloaded or printed for review is deleted or shredded at the same time.",
          ],
        },
        {
          title: "7. Retention required by law",
          paragraphs: [
            "Notwithstanding the periods above, where the following laws require a record to be kept, we keep it for the period they set.",
          ],
          list: [
            "Act on Consumer Protection in Electronic Commerce — records of contracts and withdrawal of offers: 5 years; records of payment and supply of goods: 5 years; records of consumer complaints and dispute resolution: 3 years",
            "Framework Act on National Taxes and Corporate Tax Act — books and supporting documents for transactions: 5 years",
          ],
        },
        {
          title: "8. Your rights",
          paragraphs: [
            "You may at any time ask to see, correct or delete your personal information, or ask us to stop processing it. Contact us using section 10 and we will act without delay and tell you the outcome.",
            "You may also act through a representative, who should provide a letter of authority.",
          ],
        },
        {
          title: "9. Security measures",
          list: [
            "All traffic to this site and to the internal system is encrypted with HTTPS.",
            "Access to the enquiry inbox is limited to employees signed in with a company account, and permissions are kept to the minimum the work requires.",
            "This site uses no external analytics or advertising tools such as Google Analytics. We compile our visit statistics ourselves and collect nothing beyond what sections 1 and 2 describe.",
            "This site sets no cookies. Only your display theme (light or dark) is stored in your browser, and that value is never sent to our servers.",
          ],
        },
        {
          title: "10. Privacy officer and contact",
          paragraphs: [
            "Please direct any question, complaint or request for redress concerning personal information to the contact below. We respond and act without delay.",
          ],
          list: [
            "Privacy officer: Chaejung Heo (CEO)",
            "Email: neuroheo@haddscience.com",
            "Phone: +82 31 8055 3780",
          ],
        },
        {
          title: "11. Where else to turn",
          paragraphs: [
            "If you need advice or redress for an infringement of your personal information, you may contact the following bodies in Korea.",
          ],
          list: [
            "Personal Information Dispute Mediation Committee — 1833-6972 (www.kopico.go.kr)",
            "Privacy Infringement Report Centre — 118 (privacy.kisa.or.kr)",
            "Supreme Prosecutors' Office, Cyber Investigation Division — 1301 (www.spo.go.kr)",
            "National Police Agency, Cyber Bureau — 182 (ecrm.police.go.kr)",
          ],
        },
        {
          title: "12. Changes to this policy",
          paragraphs: [
            "We announce any change on this page at least 7 days before it takes effect, and at least 30 days before where the change is to your disadvantage.",
            "The revision of November 24, 2026 adds information on how we receive job applications and how that personal information is handled. It does not reduce your rights or add to your obligations, so it takes effect on the day it is posted.",
          ],
        },
      ],
    },

    terms: {
      effectiveFrom: "2026-09-22",
      intro:
        "These terms govern the use of haddscience.com (\"the Site\"), operated by HADD SCIENCE (\"the Company\"). The Site introduces the Company and its products and receives enquiries; it has no sign-up and no payment function. Where this translation differs from the Korean version, the Korean version governs.",
      sections: [
        {
          title: "1. Definitions",
          list: [
            "\"Site\" means haddscience.com and its pages, operated by the Company.",
            "\"User\" means anyone who visits the Site and uses what it offers under these terms.",
            "\"Content\" means all material on the Site, including text, photographs, figures, video, design and trade marks.",
          ],
        },
        {
          title: "2. Effect and amendment",
          paragraphs: [
            "These terms take effect when posted on the Site. The Company may amend them within the limits of applicable law, announcing any change on this page at least 7 days before it takes effect, and at least 30 days before where the change is to the User's disadvantage.",
          ],
        },
        {
          title: "3. What the Site offers",
          list: [
            "Information about the Company and its products",
            "News and HADD:LIBRARY material",
            "Receipt of consultation and quotation requests through the contact form",
          ],
        },
        {
          title: "4. Availability",
          paragraphs: [
            "The Company aims to keep the Site available throughout the year. It may suspend all or part of the Site temporarily for maintenance or replacement of equipment, loss of communications, natural disaster or similar unavoidable cause. Where this can be foreseen we announce it on the Site; where it cannot, we announce it afterwards.",
          ],
        },
        {
          title: "5. Using the contact form",
          paragraphs: [
            "You may request a consultation or a quotation through the contact form. A member of staff reads the enquiry and replies; receipt of an enquiry does not itself form a contract or fix a quotation.",
            "The handling of personal information is governed by our Privacy policy.",
          ],
          list: [
            "You must not use another person's name or contact details, or enter information you know to be untrue.",
            "The Company may decline to reply to advertising, abusive messages, or bulk submissions made by automated programs.",
          ],
        },
        {
          title: "6. Rights in the Content",
          paragraphs: [
            "Copyright and other intellectual property rights in the Content belong to the Company or to the rightful owner. You may not reproduce, transmit, publish, distribute or broadcast the Content, or otherwise use it for commercial purposes, without the Company's prior consent.",
            "Ordinary use for introduction, reporting or research, with attribution, is not restricted by the above.",
          ],
        },
        {
          title: "7. About the product information",
          paragraphs: [
            "Specifications, methods of use and research results shown on the Site are for research purposes. They are not a basis for medical diagnosis or treatment. Results vary with actual conditions of use, so please consult the Company before applying them to your own work.",
            "Prices and stock are as at the time stated on the Site. Where a formal quotation exists, the quotation prevails.",
          ],
        },
        {
          title: "8. Limits of liability",
          paragraphs: [
            "The Company works to keep the information on the Site accurate, but is not liable for loss arising from causes beyond its control, such as natural disaster or communications failure.",
            "The Company is not responsible for the content of other sites linked from the Site.",
          ],
        },
        {
          title: "9. Governing law and jurisdiction",
          paragraphs: [
            "These terms are interpreted under the law of the Republic of Korea. Any dispute between the Company and a User arising from use of the Site is to be brought before the court having jurisdiction under the Civil Procedure Act.",
          ],
        },
      ],
    },
  },

  home: {
    heroSlides: [
      {
        title: ["Science begins with experiments.", "Innovation begins with people."],
        description: [
          "Powered by 17 years of 3D cell culture and biomaterials research, and now —",
          "creating a new standard in organoid and cell culture.",
        ],
      },
      {
        eyebrow: "LiVEGEL",
        title: ["Simply add, image in place.", "A live imaging solution for 3D organoids"],
        description: [
          "Ready to use, no preparation needed.",
          "Keep organoids in place and capture clearer live images with LiVEGEL.",
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
      { value: "17", suffix: "yrs", label: "Organoid · 3D cell culture · biomaterials research" },
      { value: "3", suffix: "Forms", label: "Syringe · Bottle · Lyophilized" },
      { value: "3", suffix: "sites", label: "Head office · Collaboration center · Institute" },
      { value: "2024", label: "HADD Science founded" },
    ],
    productSection: {
      eyebrow: "Gel-type media supplement",
      title: "For 3D cell and organoid culture.",
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
    stage: {
      vision: {
        eyebrow: "Vision",
        title: ["ADD the values to", "Human life."],
        body: [
          "We keep taking on the challenges of biotechnology and life sciences.",
          "With advanced technology and a creative approach, we build culture media solutions for human health.",
        ],
      },
      lineup: {
        eyebrow: "Product lineup",
        title: "Four forms, shaped by how research works",
        description: "Choose a format to start 3D culture and imaging of spheroids and organoids.",
      },
      scrollHint: "Scroll",
    },
    partners: {
      eyebrow: "Partners",
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
          description:
            "Research on biomaterials for organoid culture and cell therapy, and new product planning.",
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
        photo: "/team/neuro-h.webp",
      },
      {
        role: "CMO",
        name: "KH",
        specialty:
          "16+ Years in Bio & Research · Pharmaceutical · Hospital Sales Experience",
        bio: "Great technology only creates value when it reaches the market. Leveraging a strong network of researchers and industry partners, he is leading the global expansion and commercialization of ADDGEL.",
        photo: "/team/kh.webp",
      },
      {
        role: "CAO",
        name: "YH",
        specialty: "Bio & AI-Driven Marketing Strategist",
        bio: "With 13 years of experience in biopharma marketing and technical support, he combines scientific expertise with AI-driven analytics to connect innovation with researchers. His mission is to bring the value of ADDGEL to the global scientific community.",
        photo: "/team/yh.webp",
      },
      {
        role: "R&D Leader",
        name: "Ari",
        specialty: "Ph.D. in Biomedical Engineering · 3D Cell Culture & Biomaterials Expert",
        bio: "With over 10 years of experience in stem cell culture and biomaterials research, he leads the optimization of ADDGEL and spearheads the development of next-generation biomaterial solutions.",
        photo: "/team/ari.webp",
      },
      {
        role: "Technical Support & Regulatory Team Leader",
        name: "Noh",
        specialty:
          "M.S. in Pharmaceutical Sciences · Laboratory & Regulatory Affairs Specialist",
        bio: "Leveraging experience across healthcare and research institutions, he drives product validation, scientific affairs, and prototype development — building trusted solutions backed by scientific evidence.",
        photo: "/team/noh.webp",
      },
      {
        role: "Manufacturing & Certification Researcher",
        name: "Sojeong Park",
        specialty: "M.Eng. · Certification & Productization Researcher",
        bio: "Holding a master’s degree in engineering from Kyung Hee University, she conducts synthetic biology and nanomaterial process research, and owns product certification and productization processes.",
        photo: "/team/sojeong-park.webp",
      },
      {
        role: "AI Solutions Developer",
        name: "Woochang Jung",
        // 라이브 사이트는 두 사람의 설명이 서로 바뀌어 있다(2026-08-12 확인). 여기서 바로잡았다.
        specialty: "AI Talent Program · Agentic AI · Software Engineering",
        bio: "He specializes in Agentic AI and software development, building AI-powered solutions on top of biomedical data.",
        photo: "/team/woochang-jung.webp",
      },
      {
        role: "AI Development Intern",
        name: "Yongseok Ju",
        specialty: "AI Talent Program · ML/DL · Multi-modal",
        bio: "As an undergraduate research intern, he specializes in ML/DL and multimodal AI modeling, supporting biomedical data analysis and scientific research through AI-driven approaches.",
        photo: "/team/yongseok-ju.webp",
      },
    ],
  },

  location: {
    pageTitle: "Location",
    breadcrumb: "ABOUT",
    headline: "Head Office & Research Institute",
    mapNote: "Drag or zoom the map to explore.",
    directions: "Directions",
    mapProviders: [
      { id: "google", label: "Google Maps" },
      { id: "kakao", label: "Kakao Map" },
      { id: "naver", label: "Naver Map" },
    ],
  },

  products: [
    {
      id: "addgel",
      name: "ADDGEL",
      eyebrow: "Gel-type media supplement",
      tagline: "for 3D cell and organoid culture.",
      heading: "ADDGEL — Three forms, one powerful 3D culture solution",
      description:
        "A gel-type supplement mixed into your own medium — replaces Matrigel and hydrogels in 3D cell and organoid culture.",
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
      eyebrow: "Ready-to-use live imaging solution",
      tagline: "for imaging 3D organoids & spheroids.",
      heading: "LiVEGEL — Simply add, image in place.",
      description:
        "A ready-to-use liquid solution for 3D live imaging of organoids and spheroids.",
      regulatory: "For research use only",
      href: "/products/livegel",
      variants: [
        {
          id: "livegel-1ml",
          name: "LiVEGEL",
          form: "Dropper bottle · 3 mL / 5 mL",
          image: "/products/livegel.webp",
          imageAlt: "LiVEGEL Dropper bottle",
          storage: "2°C ~ 8°C",
          sampleRequest: true,
          sampleNote:
            "Press the sample request button and complete the form to request a sample.",
        },
      ],
      // 공용 FAQ·CTA 는 ADDGEL 기준이다. LiVEGEL 은 배양 배지가 아니라 이미징 솔루션이라 따로 둔다.
      faq: [
        {
          q: "Is LiVEGEL a culture medium?",
          a: "No. LiVEGEL is a live imaging solution for 3D organoids and spheroids. Add your organoids to LiVEGEL at the point of imaging or electrophysiological recording.",
        },
        {
          q: "How do I use it?",
          a: "(1) Bring refrigerated LiVEGEL to room temperature just before use. (2) Place your organoids with LiVEGEL in an imaging plate, such as a 24-well plate. (3) Start time-lapse live imaging. Organoids stay in place throughout long-term imaging.",
        },
        {
          q: "What does it do?",
          a: "It holds organoids in place during long-term imaging and MEA recording, reducing image mismatch, and improves fluorescence image clarity (in-house data: about 20% sharper on average in SH-SY5Y cells).",
        },
        {
          q: "How should LiVEGEL be stored?",
          a: "Store at 2–8°C and bring to room temperature just before use.",
        },
        {
          q: "Can I use it with ADDGEL?",
          a: "Yes. Organoids grown in ADDGEL can be transferred to LiVEGEL for long-term live imaging.",
        },
        {
          q: "Can I get a sample?",
          a: "Samples are available for LiVEGEL. Tell us about your cells and imaging setup on the contact page, and we will follow up.",
        },
        {
          q: "Can the products be used for clinical or diagnostic purposes?",
          a: "No. All products are for research use only.",
        },
      ],
      ctaBand: {
        title: "Let us help you set up LiVEGEL for your imaging.",
        description:
          "Tell us about your cells or organoids and your imaging setup, and we will recommend a sample and protocol.",
      },
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
    prevPost: "Previous",
    nextPost: "Next",
    backToList: "Back to list",
    readOriginal: "Read the original",
    items: [],
  },

  library: {
    pageTitle: "HADD:Library",
    breadcrumb: "HADD:LIBRARY",
    headline: "HADD:Library",
    disclaimer:
      "Article summaries are based on actual news sources. Images are AI-generated for illustrative purposes.",
    // Items come from Omnis posts (category=library) — content/server.ts
    items: [],
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
      tooLong: "This is too long — please shorten it a little.",
      failTitle: "We cannot take your enquiry right now.",
      failBody:
        "Please try again in a moment. If it is urgent, use the button below to email us directly.",
      failMailto: "Send by email",
      rateLimited:
        "Too many enquiries from here. Please try again later — anything you already sent has been received.",
    },
  },

  /** 채용. 구조와 근거는 `ko.ts` 의 `career` 와 같다 — 그쪽을 먼저 고치고 옮긴다. */
  career: {
    pageTitle: "Careers",
    breadcrumb: "CAREER",
    headline: "Join HADD SCIENCE",
    description: "Browse our open positions and apply directly from this page.",
    list: {
      searchLabel: "Search positions",
      searchPlaceholder: "Search by title or what you'll work on",
      fieldLabel: "Field",
      typeLabel: "Type",
      all: "All",
      count: "{n} open positions",
      empty: "No positions match these filters.",
      reset: "Clear filters",
      open: "Open",
      closed: "Closed",
    },
    fields: [{ value: "bio-company", label: "Research, dev & planning" }],
    types: [{ value: "practicum", label: "Practicum internship" }],
    detail: {
      summaryTitle: "At a glance",
      photosTitle: "Where you'll work",
      carousel: {
        label: "Workplace photos",
        prev: "Previous photo",
        next: "Next photo",
        goTo: "Show photo {n}",
        position: "{n} / {total}",
      },
      tracksTitle: "What you can work on",
      tracksNote: "The work we need doesn't fit into a single role, so we've split it into three tracks. Tell us which ones interest you in the application and we'll take it into account.",
      periodTitle: "Application period",
      countdownLabel: "Closes in",
      units: { days: "d", hours: "h", minutes: "m", seconds: "s" },
      stepsTitle: "Hiring process",
      notesTitle: "Good to know",
      applyCta: "Apply now",
      backToList: "← All positions",
      closedNotice: "Applications are closed.",
    },
    form: {
      title: "Application",
      description: "Fields marked * are required.",
      name: "Name",
      department: "Department",
      departmentPlaceholder: "e.g. Division of Data Science",
      studentId: "Student ID",
      studentIdPlaceholder: "Digits only",
      grade: "Year",
      gradeOptions: [
        { value: "3", label: "3rd year" },
        { value: "4", label: "4th year" },
      ],
      gradePlaceholder: "Select your year",
      graduation: "Expected graduation",
      graduationPlaceholder: "e.g. February 2028",
      phone: "Phone",
      phonePlaceholder: "010-0000-0000",
      email: "Email",
      emailPlaceholder: "you@example.com",
      resume: "Résumé",
      resumeHint: "One PDF file, up to 10 MB.",
      portfolio: "Portfolio",
      portfolioHint: "Optional. Upload a file (PDF, up to 10 MB) or share a link — whichever suits you.",
      portfolioFile: "File",
      portfolioUrl: "Link",
      portfolioUrlPlaceholder: "https://github.com/…",
      motivation: "Why this internship?",
      motivationPlaceholder: "Tell us briefly why you're applying and what you'd like to work on.",
      charCount: "{n} / {max} characters",
      interests: "Tracks you're interested in",
      interestsHint: "Optional. Pick as many as you like.",
      consentTitle: "Collection and use of personal information",
      consentTable: {
        head: ["Items collected", "Purpose", "Retention"],
        rows: [
          [
            "Name, department, student ID, year, expected graduation, phone, email, résumé, portfolio (if provided), tracks of interest (if selected), motivation",
            "Selecting practicum interns and notifying applicants of the result",
            "Six months after selection closes (12 months from the date received where no close of selection is set), then destroyed without delay.",
          ],
        ],
      },
      consentRefusal:
        "You may decline. If you do, however, we will not be able to accept your application. Your portfolio and tracks of interest are optional — leaving them out does not count against you. Applications are received and kept in the Company's mailbox (info@haddscience.com).",
      consent: "I have read the above and agree to the collection and use of my personal information.",
      submit: "Submit application",
      submitting: "Submitting…",
      successTitle: "Application received",
      successBody: "We'll review it and let you know the result using the contact details you provided.",
      required: "This field is required.",
      invalidEmail: "Please check your email address.",
      invalidPhone: "Please check your phone number.",
      invalidStudentId: "Use digits only.",
      invalidUrl: "Enter an address starting with http:// or https://.",
      notPdf: "Only PDF files can be uploaded.",
      tooLarge: "Files larger than 10 MB can't be uploaded.",
      tooLong: "This is too long.",
      failTitle: "We couldn't receive your application online",
      failBody:
        "Online applications aren't available right now. The button below opens an email with everything you entered.",
      attachNotice: "When the email with your details opens, please attach your résumé (PDF) and send it.",
      failMailto: "Apply by email",
      rateLimited: "You've submitted several times in a short period. Please try again shortly, or apply by email.",
      reset: "Start over",
      mailSubjectPrefix: "Application",
      mailAttachNote: "* Please attach your résumé (PDF) to this email.",
    },
    jobs: [
      {
        slug: "suwon-anchor-practicum-intern-2026-winter",
        title: "[USW Anchor Project × Field Practicum] Intern",
        summary: "An eight-week practicum where you come and do real work at a bio company.",
        field: "bio-company",
        type: "practicum",
        closesAt: "2026-11-27T17:00:00+09:00",
        periodLabel: "Nov 24 – Nov 27 (Fri), 2026, 5:00 PM KST",
        tags: ["Practicum", "8 weeks", "USW 3rd–4th year"],
        facts: [
          { label: "Openings", value: "3" },
          { label: "Period", value: "Dec 28, 2026 – Feb 19, 2027 (8 weeks)" },
          {
            label: "Working hours",
            value: "Weekdays 9:00 AM to 2:00 PM, including a one-hour lunch break (4 hours of work a day)",
          },
          {
            label: "Location",
            value: "Lab Station, 8F Gyeonggi Bio Center (147 Gwanggyo-ro, Yeongtong-gu, Suwon)",
          },
        ],
        photos: [
          {
            src: "/career/meeting-room.webp",
            alt: "Meeting room at Lab Station with a long table and chairs",
            caption: "Meeting room, Lab Station, Gwanggyo Bio Hub",
          },
          {
            src: "/career/lounge.webp",
            alt: "Lab Station lounge with curved sofas and small side tables",
            caption: "Lounge, Lab Station, Gwanggyo Bio Hub",
          },
          {
            src: "/career/lab.webp",
            alt: "Basic bio lab with benches, reagent shelves and a refrigerator",
            caption: "Lab, Lab Station, Gwanggyo Bio Hub",
          },
          {
            src: "/career/shared-office.webp",
            alt: "Desks inside the shared office at Lab Station",
            caption: "Shared office, Lab Station, Gwanggyo Bio Hub",
            fit: "contain",
          },
        ],
        tracks: [
          { value: "ai-bio", label: "AI-driven bio research" },
          { value: "dev", label: "Developing our internal work system (Omnis) and website" },
          { value: "grants", label: "Writing applications for national R&D programs and TIPS" },
        ],
        sections: [
          {
            title: "About the practicum",
            paragraphs: [
              "HADD SCIENCE is a bio company that makes biomaterials for organoids and 3D cell culture. For eight weeks you'll work alongside us and see how a bio company actually runs.",
            ],
          },
          {
            title: "Who can apply",
            list: [
              "3rd- or 4th-year students at the University of Suwon taking part in the field practicum credit program",
              "Students graduating in February 2027 cannot take part",
            ],
          },
        ],
        steps: [
          { label: "Document review" },
          { label: "Interview", detail: "Tuesday, December 1, 2026, 11:00 AM, Labstation 8F" },
          { label: "Final selection" },
          { label: "University practicum paperwork" },
        ],
        notes: [
          "Dates and hours may change to fit the university's schedule.",
          "Please bring your own laptop.",
          "Selected students then complete the university's Field Practicum Support Center paperwork separately.",
        ],
      },
    ],
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
          { label: "Careers", href: "/career" },
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

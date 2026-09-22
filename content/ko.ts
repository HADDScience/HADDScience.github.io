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
        mapQuery: "경기도 화성시 봉담읍 와우안길 17 수원대학교 고운첨단과학기술원",
      },
      {
        kind: "연구협력기관",
        name: "성균관대학교 Branics Lab",
        address: "성균관대학교 자연과학캠퍼스 N센터 6층 Branics Lab",
        mapQuery: "성균관대학교 자연과학캠퍼스 N센터",
      },
      {
        kind: "연구소",
        name: "경기바이오센터 랩스테이션",
        address: "경기도 수원시 영통구 광교로 147, 경기바이오센터 8층 랩스테이션 8B",
        mapQuery: "경기도 수원시 영통구 광교로 147 경기바이오센터",
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
    // 브랜드 표기라 영문 페이지도 같은 말을 쓴다.
    pinned: "HADD PICK",
    mainLine: "대표번호",
    fax: "팩스",
    inquirySubjectPrefix: "홈페이지 문의",
  },

  legal: {
    breadcrumb: "LEGAL",
    effectiveLabel: "시행일",

    /**
     * 이 방침의 모든 항목은 사이트가 실제로 하는 일에서 왔다. 수집 항목은
     * `components/forms/contact-form.tsx` 와 `app/api/contact/route.ts` 가, 보관 위치는
     * Omnis 의 `WebsiteInquiry` 가, 국외 이전은 그 DB 가 얹힌 Neon 의 리전이 근거다.
     * 조항을 고치기 전에 그 셋 중 무엇이 바뀌었는지 먼저 확인한다.
     */
    privacy: {
      effectiveFrom: "2026-09-22",
      intro:
        "하드사이언스(이하 '회사')는 haddscience.com 을 운영하면서 이용자의 개인정보를 「개인정보 보호법」을 비롯한 관련 법령에 따라 처리합니다. 이 방침은 회사가 어떤 개인정보를 어떤 목적으로 받아 어떻게 다루고 언제 없애는지를 알리기 위한 것입니다.",
      sections: [
        {
          title: "1. 수집하는 개인정보와 이용 목적",
          paragraphs: [
            "회사가 이 사이트에서 이용자의 정보를 받는 곳은 문의하기 양식과 방문 통계 두 곳입니다. 회원가입 절차와 결제 기능이 없으며, 그 밖의 경로로 이용자의 개인정보를 모으지 않습니다.",
          ],
          table: {
            head: ["구분", "항목", "이용 목적", "보유 기간"],
            rows: [
              [
                "문의하기 (필수)",
                "이름, 이메일 주소, 문의 내용",
                "문의 확인과 회신",
                "접수일로부터 3년",
              ],
              [
                "문의하기 (선택)",
                "소속, 연락처, 문의 유형",
                "회신 수단 확보, 견적 및 제품 안내",
                "접수일로부터 3년",
              ],
              [
                "접수 시 자동 수집",
                "접속 IP 주소, 브라우저 정보(User-Agent), 접수 일시",
                "자동 프로그램에 의한 대량·중복 접수 차단",
                "접수일로부터 3년",
              ],
              [
                "방문 통계 (자동 수집)",
                "방문한 페이지 주소, 언어, 기기 구분(모바일·데스크톱), 유입처 도메인, 방문자 구분 해시",
                "어느 페이지가 얼마나 읽히는지 파악",
                "방문일로부터 400일",
              ],
            ],
          },
        },
        {
          title: "2. 방문자 구분 해시에 대하여",
          paragraphs: [
            "방문 통계의 '방문자 구분 해시'는 접속 IP 주소와 브라우저 정보에 그날 날짜를 섞어 만든 값입니다. IP 주소와 브라우저 정보 자체는 저장하지 않고 해시를 만든 즉시 버리며, 회사의 업무시스템으로도 넘기지 않습니다.",
            "날짜가 섞여 있어 날이 바뀌면 같은 사람도 다른 값이 됩니다. 그래서 어제와 오늘의 방문을 이어 붙이거나 한 사람의 방문 이력을 따라갈 수 없습니다. 이 사이트는 방문자를 알아보기 위한 쿠키를 쓰지 않습니다.",
            "관리자 화면(/admin)의 이용은 집계하지 않습니다.",
          ],
        },
        {
          title: "3. 접수된 문의가 처리되는 경로",
          paragraphs: [
            "접수된 문의는 회사 내부 업무시스템의 문의함에 먼저 쌓이고, 담당자가 내용을 확인한 뒤에야 고객·견적 기록으로 옮겨집니다. 담당자가 옮기지 않은 문의는 고객 기록이 되지 않으며 보유 기간이 지나면 문의함에서 파기됩니다.",
            "문의가 견적 상담으로 이어진 경우, 그때부터 해당 정보는 거래 상대방의 정보로서 아래 '7. 법령에 따른 보관'의 기간을 따릅니다.",
          ],
        },
        {
          title: "4. 개인정보의 제3자 제공",
          paragraphs: [
            "회사는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 특별한 규정이 있거나, 수사기관이 법령이 정한 절차와 방법에 따라 요구하는 경우에는 그에 따릅니다.",
          ],
        },
        {
          title: "5. 처리 위탁과 국외 이전",
          paragraphs: [
            "회사는 홈페이지와 업무시스템의 설비를 직접 두지 않고 아래 사업자의 것을 빌려 씁니다. 이 과정에서 문의 내용이 국외에 보관됩니다.",
          ],
          table: {
            head: ["받는 자", "맡기는 일", "이전 항목", "보관 국가", "이전 시기와 방법"],
            rows: [
              [
                "Vercel Inc. (미국)",
                "홈페이지와 업무시스템의 호스팅 및 요청 처리",
                "문의 양식에 입력한 항목 전체",
                "미국 — 요청을 처리하는 서버는 서울 리전에 있습니다. Vercel 은 문의 내용을 따로 저장하지 않으나, 접속 기록(IP 주소 포함)이 로그로 남습니다.",
                "이용자가 문의를 보내는 시점에 네트워크를 통해 전송",
              ],
              [
                "Neon Inc. (미국)",
                "문의 내용과 방문 통계의 데이터베이스 보관",
                "문의 양식에 입력한 항목 전체와 자동 수집 항목, 방문 통계 항목",
                "싱가포르",
                "접수와 동시에 전송되어 저장",
              ],
            ],
          },
          list: [
            "받는 자의 보유 기간: 회사가 위탁을 마치거나 해당 정보를 삭제할 때까지입니다.",
            "이용자는 개인정보의 국외 이전을 거부할 수 있습니다. 거부하려면 문의 양식 대신 아래 '10. 문의처'의 전화나 이메일을 이용해 주십시오.",
            "문의 양식을 통한 접수는 위 이전 없이는 이루어질 수 없으므로, 거부하시는 경우 양식으로는 문의를 보낼 수 없습니다. 다른 수단으로 연락하시는 데에는 아무 제한이 없습니다.",
          ],
        },
        {
          title: "6. 개인정보의 파기",
          paragraphs: [
            "회사는 보유 기간이 지나거나 처리 목적이 이루어진 개인정보를 지체 없이 파기합니다. 전자적 파일 형태의 정보는 복구할 수 없는 방법으로 삭제합니다.",
          ],
        },
        {
          title: "7. 법령에 따른 보관",
          paragraphs: [
            "위 보유 기간에도 불구하고, 다음 법령이 일정 기간의 보관을 정한 경우에는 그 기간 동안 보관합니다.",
          ],
          list: [
            "「전자상거래 등에서의 소비자보호에 관한 법률」 — 계약 또는 청약철회 등에 관한 기록 5년, 대금 결제 및 재화 등의 공급에 관한 기록 5년, 소비자의 불만 또는 분쟁 처리에 관한 기록 3년",
            "「국세기본법」·「법인세법」 등 세법 — 거래에 관한 장부와 증거서류 5년",
          ],
        },
        {
          title: "8. 정보주체의 권리와 행사 방법",
          paragraphs: [
            "이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요구할 수 있습니다. 아래 '10. 문의처'로 연락하시면 회사는 지체 없이 조치하고 그 결과를 알려 드립니다.",
            "이용자는 대리인을 통해서도 권리를 행사할 수 있으며, 이 경우 위임장을 제출해 주셔야 합니다.",
          ],
        },
        {
          title: "9. 개인정보의 안전성 확보 조치",
          list: [
            "이 사이트와 업무시스템의 모든 통신은 HTTPS 로 암호화됩니다.",
            "문의함에 접근할 수 있는 사람은 회사 계정으로 로그인한 임직원으로 제한되며, 접근 권한은 업무에 필요한 최소한으로 둡니다.",
            "이 사이트는 구글 애널리틱스 같은 외부 분석·광고 도구를 쓰지 않습니다. 방문 통계는 회사가 직접 집계하며, 위 1·2절에 적은 것 외에는 모으지 않습니다.",
            "이 사이트는 쿠키를 사용하지 않습니다. 화면 테마(밝게·어둡게) 설정만 이용자의 브라우저에 저장되며, 이 값은 회사 서버로 전송되지 않습니다.",
          ],
        },
        {
          title: "10. 개인정보 보호책임자와 문의처",
          paragraphs: [
            "개인정보 처리에 관한 문의, 불만, 피해 구제는 아래로 연락해 주십시오. 회사는 접수된 사항에 대해 지체 없이 답변하고 처리합니다.",
          ],
          list: [
            "개인정보 보호책임자: 허채정 (대표)",
            "이메일: neuroheo@haddscience.com",
            "전화: +82 31 8055 3780",
          ],
        },
        {
          title: "11. 권익침해 구제 방법",
          paragraphs: [
            "개인정보 침해로 상담이나 피해 구제가 필요하시면 아래 기관에 문의하실 수 있습니다.",
          ],
          list: [
            "개인정보분쟁조정위원회 — 1833-6972 (www.kopico.go.kr)",
            "개인정보침해신고센터 — 118 (privacy.kisa.or.kr)",
            "대검찰청 사이버수사과 — 1301 (www.spo.go.kr)",
            "경찰청 사이버수사국 — 182 (ecrm.police.go.kr)",
          ],
        },
        {
          title: "12. 방침의 변경",
          paragraphs: [
            "이 방침을 변경할 때에는 시행일 7일 전부터 이 페이지에 알립니다. 이용자에게 불리한 변경인 경우에는 30일 전부터 알립니다.",
          ],
        },
      ],
    },

    terms: {
      effectiveFrom: "2026-09-22",
      intro:
        "이 약관은 하드사이언스(이하 '회사')가 haddscience.com(이하 '사이트')에서 제공하는 서비스의 이용 조건을 정합니다. 이 사이트는 회사와 제품을 소개하고 문의를 받는 곳으로, 회원가입 절차와 결제 기능이 없습니다.",
      sections: [
        {
          title: "1. 용어의 뜻",
          list: [
            "'사이트'란 회사가 운영하는 haddscience.com 및 그 하위 페이지를 말합니다.",
            "'이용자'란 사이트에 접속하여 이 약관에 따라 사이트가 제공하는 내용을 이용하는 사람을 말합니다.",
            "'콘텐츠'란 사이트에 실린 글, 사진, 도표, 영상, 디자인, 상표 등 일체의 자료를 말합니다.",
          ],
        },
        {
          title: "2. 약관의 효력과 변경",
          paragraphs: [
            "이 약관은 사이트에 게시함으로써 효력이 생깁니다. 회사는 관련 법령을 어기지 않는 범위에서 약관을 바꿀 수 있으며, 바꿀 때에는 시행일 7일 전부터 이 페이지에 알립니다. 이용자에게 불리한 변경인 경우에는 30일 전부터 알립니다.",
          ],
        },
        {
          title: "3. 서비스의 내용",
          list: [
            "회사와 제품에 관한 정보 제공",
            "뉴스와 하드:라이브러리 등 자료 제공",
            "문의하기 양식을 통한 상담 및 견적 접수",
          ],
        },
        {
          title: "4. 서비스의 제공과 중단",
          paragraphs: [
            "회사는 사이트를 연중 제공하기 위해 노력합니다. 다만 설비 점검·교체, 통신 두절, 천재지변 등 부득이한 사유가 있을 때에는 서비스의 전부 또는 일부를 일시적으로 멈출 수 있습니다. 미리 알 수 있는 경우에는 사이트에 알리고, 알릴 수 없는 사정이 있을 때에는 사후에 알립니다.",
          ],
        },
        {
          title: "5. 문의하기 이용",
          paragraphs: [
            "이용자는 문의하기 양식으로 상담과 견적을 요청할 수 있습니다. 접수된 문의는 담당자가 내용을 확인한 뒤 회신하며, 접수 자체가 계약의 성립이나 견적의 확정을 뜻하지 않습니다.",
            "개인정보의 처리에 관한 사항은 개인정보처리방침에 따릅니다.",
          ],
          list: [
            "이용자는 타인의 이름·연락처를 도용하거나 사실과 다른 내용을 적어서는 안 됩니다.",
            "회사는 광고, 욕설, 자동 프로그램에 의한 대량 발송 등 정상적인 상담으로 보기 어려운 문의에 회신하지 않을 수 있습니다.",
          ],
        },
        {
          title: "6. 콘텐츠의 권리",
          paragraphs: [
            "사이트의 콘텐츠에 대한 저작권과 그 밖의 지식재산권은 회사 또는 정당한 권리자에게 있습니다. 이용자는 회사의 사전 동의 없이 콘텐츠를 복제, 전송, 출판, 배포, 방송하거나 그 밖의 방법으로 영리 목적에 이용할 수 없습니다.",
            "인용 표시와 함께 이루어지는 통상적인 소개·보도·연구 목적의 이용은 이를 제한하지 않습니다.",
          ],
        },
        {
          title: "7. 제품 정보에 관한 안내",
          paragraphs: [
            "사이트에 실린 제품의 규격, 사용 방법, 연구 결과는 연구용 정보이며 의학적 진단이나 치료의 근거로 쓸 수 없습니다. 실제 사용 조건에 따라 결과가 달라질 수 있으므로, 구체적인 적용은 회사와 상담하여 결정해 주십시오.",
            "가격과 재고는 사이트에 적힌 시점을 기준으로 하며, 정식 견적서에 적힌 내용이 우선합니다.",
          ],
        },
        {
          title: "8. 책임의 한계",
          paragraphs: [
            "회사는 사이트의 정보를 정확하게 유지하기 위해 노력하지만, 천재지변·통신 장애 등 회사의 통제를 벗어난 사유로 발생한 손해에 대해서는 책임을 지지 않습니다.",
            "사이트에서 밖으로 연결된 다른 사이트의 내용에 대해서는 회사가 책임지지 않습니다.",
          ],
        },
        {
          title: "9. 준거법과 관할",
          paragraphs: [
            "이 약관은 대한민국 법에 따라 해석합니다. 사이트 이용과 관련하여 회사와 이용자 사이에 분쟁이 생긴 경우, 소송은 민사소송법이 정한 관할 법원에 제기합니다.",
          ],
        },
      ],
    },
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
    stage: {
      vision: {
        eyebrow: "Vision",
        title: ["ADD the values to", "Human life."],
        body: [
          "바이오테크놀로지와 생명과학 분야에서 도전을 이어갑니다.",
          "최첨단 기술과 창의적인 접근으로 인류 건강을 위한 배양액 솔루션을 만듭니다.",
        ],
      },
      lineup: {
        eyebrow: "Product lineup",
        title: "연구가 필요한 형태로, 네 가지",
        description: "제형만 고르면 3차원 배양이 시작됩니다.",
      },
      scrollHint: "스크롤",
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
    mapNote: "지도를 눌러 확대하거나 이동할 수 있습니다.",
    directions: "길찾기",
    mapProviders: [
      { id: "kakao", label: "카카오맵" },
      { id: "naver", label: "네이버 지도" },
      { id: "google", label: "Google 지도" },
    ],
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
    prevPost: "이전 글",
    nextPost: "다음 글",
    backToList: "목록으로",
    readOriginal: "원문 보기",
    items: [],
  },

  library: {
    pageTitle: "하드:라이브러리",
    breadcrumb: "HADD:LIBRARY",
    headline: "HADD:Library",
    disclaimer:
      "기사 요약은 실제 뉴스 출처를 기반으로 하며, 이미지는 이해를 돕기 위해 AI로 생성한 것입니다.",
    // 목록은 Omnis 의 기사(category=library)에서 온다 — content/server.ts
    items: [],
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
      tooLong: "너무 깁니다. 조금 줄여 주세요.",
      failTitle: "지금은 접수가 되지 않습니다.",
      failBody:
        "잠시 뒤에 다시 시도해 주세요. 급하시면 아래 버튼으로 메일을 보내 주셔도 됩니다.",
      failMailto: "메일로 보내기",
      rateLimited:
        "문의가 너무 잦습니다. 잠시 뒤에 다시 시도해 주세요. 이미 보내신 문의는 접수돼 있습니다.",
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

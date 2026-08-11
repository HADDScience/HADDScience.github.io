import type { NewsItem } from "./types"

/**
 * haddscience.com/news 게시판에서 옮긴 48건 (2026-08-07 기준).
 *
 * 미디어는 전부 자체 호스팅이다. `scripts/fetch-news-media.mjs` 가 아임웹 CDN 에서
 * 내려받아 `public/news/` 로 옮기고 webp 로 리사이즈한다 (썸네일 48장 + 카드뉴스 82장).
 *
 * - `cards` 가 있는 10건은 사이트 안에 상세 페이지(`/news/<id>`)가 있다.
 * - 나머지 38건은 `href` 가 아직 아임웹 원본 게시글을 가리킨다. 아임웹을 해지하려면
 *   `scripts/fetch-news-media.mjs` 의 CARD_SETS 에 나머지 글의 이미지 목록을 추가하면 된다.
 * - 제목의 이모지는 고객사가 실제로 발행한 카피이므로 임의로 지우지 않고 그대로 두었다.
 *   (디자인시스템의 "no emoji" 규칙은 브랜드 UI 에 적용되며, 편집 콘텐츠에는 적용하지 않았다.)
 */
const post = (id: string) =>
  `https://www.haddscience.com/news/?bmode=view&idx=${id}&t=board`

export const newsKo: NewsItem[] = [
  { id: "172288285", date: "2026.07.08", title: "포럼 무대에 오른 하드사이언스, 3차원 배양·오가노이드 기술로 협력 모색 👀", image: "/news/thumb/172288285.webp", href: `/news/172288285`, cards: ["/news/172288285/01.webp", "/news/172288285/02.webp", "/news/172288285/03.webp", "/news/172288285/04.webp", "/news/172288285/05.webp", "/news/172288285/06.webp", "/news/172288285/07.webp", "/news/172288285/08.webp"] },
  { id: "172288167", date: "2026.07.08", title: "[BIO USA] 하드사이언스, 세계 최대 바이오 무대에 서다 🌍", image: "/news/thumb/172288167.webp", href: `/news/172288167`, cards: ["/news/172288167/01.webp", "/news/172288167/02.webp", "/news/172288167/03.webp", "/news/172288167/04.webp", "/news/172288167/05.webp", "/news/172288167/06.webp", "/news/172288167/07.webp", "/news/172288167/08.webp", "/news/172288167/09.webp"] },
  { id: "172288085", date: "2026.07.08", title: "🔥 ‘Innovation in Women's Health’ 무대 위, 하드사이언스 글로벌 혁신가들과 어깨를 나란히 하다", image: "/news/thumb/172288085.webp", href: `/news/172288085`, cards: ["/news/172288085/01.webp", "/news/172288085/02.webp", "/news/172288085/03.webp", "/news/172288085/04.webp", "/news/172288085/05.webp", "/news/172288085/06.webp", "/news/172288085/07.webp", "/news/172288085/08.webp"] },
  { id: "172090251", date: "2026.06.29", title: "🧬 KASBP 2026 Spring Symposium", image: "/news/thumb/172090251.webp", href: `/news/172090251`, cards: ["/news/172090251/01.webp", "/news/172090251/02.webp", "/news/172090251/03.webp", "/news/172090251/04.webp", "/news/172090251/05.webp", "/news/172090251/06.webp"] },
  { id: "172090197", date: "2026.06.29", title: "🎤 Aquillius ‘Symbiosyx’ 피칭, 샌디에이고 바이오 허브에 하드사이언스가 찾아가다", image: "/news/thumb/172090197.webp", href: `/news/172090197`, cards: ["/news/172090197/01.webp", "/news/172090197/02.webp", "/news/172090197/03.webp", "/news/172090197/04.webp", "/news/172090197/05.webp", "/news/172090197/06.webp", "/news/172090197/07.webp"] },
  { id: "172090069", date: "2026.06.29", title: "🏆 정우창 사원, 경과원 현업적용 우수사례 공모전 최우수상 수상", image: "/news/thumb/172090069.webp", href: `/news/172090069`, cards: ["/news/172090069/01.webp", "/news/172090069/02.webp", "/news/172090069/03.webp", "/news/172090069/04.webp", "/news/172090069/05.webp", "/news/172090069/06.webp", "/news/172090069/07.webp"] },
  { id: "171780067", date: "2026.06.12", title: "🧬 하드사이언스 X 코아스템켐온, '오가노이드 플랫폼' 공동개발 맞손!", image: "/news/thumb/171780067.webp", href: `/news/171780067`, cards: ["/news/171780067/01.webp", "/news/171780067/02.webp", "/news/171780067/03.webp", "/news/171780067/04.webp", "/news/171780067/05.webp", "/news/171780067/06.webp", "/news/171780067/07.webp", "/news/171780067/08.webp", "/news/171780067/09.webp"] },
  { id: "171397323", date: "2026.05.25", title: "2026 바이오아이코어사업 선정 🚀", image: "/news/thumb/171397323.webp", href: `/news/171397323`, cards: ["/news/171397323/01.webp", "/news/171397323/02.webp", "/news/171397323/03.webp", "/news/171397323/04.webp", "/news/171397323/05.webp", "/news/171397323/06.webp", "/news/171397323/07.webp"] },
  { id: "171402558", date: "2026.05.21", title: "[최우수상] 하드사이언스 정우창, AI 챗봇 'Omnis'로 스타트업 업무 혁신을 증명하다! 🤖", image: "/news/thumb/171402558.webp", href: `/news/171402558`, cards: ["/news/171402558/01.webp", "/news/171402558/02.webp", "/news/171402558/03.webp", "/news/171402558/04.webp", "/news/171402558/05.webp", "/news/171402558/06.webp", "/news/171402558/07.webp", "/news/171402558/08.webp", "/news/171402558/09.webp", "/news/171402558/10.webp", "/news/171402558/11.webp", "/news/171402558/12.webp", "/news/171402558/13.webp"] },
  { id: "171327290", date: "2026.05.21", title: "🧬 첨단바이오 기업 '하드사이언스', 코스메슈티컬·재생의료 동시 출사표!", image: "/news/thumb/171327290.webp", href: `/news/171327290`, cards: ["/news/171327290/01.webp", "/news/171327290/02.webp", "/news/171327290/03.webp", "/news/171327290/04.webp", "/news/171327290/05.webp", "/news/171327290/06.webp", "/news/171327290/07.webp", "/news/171327290/08.webp"] },
  { id: "171149202", date: "2026.05.06", title: "🧬 BIO KOREA 2026 x 하드사이언스", image: "/news/thumb/171149202.webp", href: post("171149202") },
  { id: "170848929", date: "2026.04.14", title: "🧬 하드사이언스, ‘세계 오가노이드 날’ 3주년 학술대회 성료!", image: "/news/thumb/170848929.webp", href: post("170848929") },
  { id: "170366975", date: "2026.03.12", title: "하드사이언스, 순창 ‘마이크로바이옴’ 현장 습격 사건! 🏃", image: "/news/thumb/170366975.webp", href: post("170366975") },
  { id: "170335521", date: "2026.03.10", title: "애드젤(ADDGEL), 이제 세계 지도를 펼치다! 🌍 하드사이언스 X 수원대 RISE ‘글로벌 수출 아카데미’ 생생 리포트 ✈️", image: "/news/thumb/170335521.webp", href: post("170335521") },
  { id: "170273004", date: "2026.03.05", title: "화성시 바이오 판도를 바꾸는 하이패스! 하드사이언스 X RISE", image: "/news/thumb/170273004.webp", href: post("170273004") },
  { id: "170271833", date: "2026.03.05", title: "동물실험의 미래, 하드사이언스가 제시하는 '세포배양의 새로운 기준'", image: "/news/thumb/170271833.webp", href: post("170271833") },
  { id: "169639982", date: "2026.01.24", title: "AI가 일상이 된 세상, 기술의 한계는 사라졌습니다 🔭", image: "/news/thumb/169639982.webp", href: post("169639982") },
  { id: "169044167", date: "2025.12.15", title: "하드사이언스, 화성특례시장 표창 수상! 🏆", image: "/news/thumb/169044167.webp", href: post("169044167") },
  { id: "168928073", date: "2025.12.08", title: "🏆 하드사이언스, 경기지방중소벤처기업청장 표창 수상", image: "/news/thumb/168928073.webp", href: post("168928073") },
  { id: "168819369", date: "2025.11.29", title: "(주)하드사이언스, ✨대상✨ 수상! 2025 창업인큐베이팅 경진대회 중소벤처기업부 장관상 🏆", image: "/news/thumb/168819369.webp", href: post("168819369") },
  { id: "168745762", date: "2025.11.24", title: "하드사이언스, 2025 Makers Festa", image: "/news/thumb/168745762.webp", href: post("168745762") },
  { id: "168671292", date: "2025.11.19", title: "🎉 2025 화성특례시 Startup Coming Day 성료!", image: "/news/thumb/168671292.webp", href: post("168671292") },
  { id: "168549942", date: "2025.11.18", title: "하드사이언스 X MJ프론티어 전략적 업무협약(MOU) 체결!", image: "/news/thumb/168549942.webp", href: post("168549942") },
  { id: "168456431", date: "2025.11.18", title: "🔬 하드사이언스, 오가노이드 학회 부스에서 오가노이드 배양 플랫폼 선보여!", image: "/news/thumb/168456431.webp", href: post("168456431") },
  { id: "168284367", date: "2025.10.29", title: "✨ 하드사이언스, KSEA 심포지엄 후원 성료!", image: "/news/thumb/168284367.webp", href: post("168284367") },
  { id: "168283066", date: "2025.10.29", title: "하드사이언스, '2025 경기 스타트업 서밋(G-SUMMIT)' 참가", image: "/news/thumb/168283066.webp", href: post("168283066") },
  { id: "168265042", date: "2025.10.29", title: "🚀 하드사이언스 허채정 대표, 부산대 강단에 서다! \"바이오와 물리의 융합\" 특강 성료", image: "/news/thumb/168265042.webp", href: post("168265042") },
  { id: "168027347", date: "2025.10.29", title: "하드사이언스 협력 기업 에딧미, 과학기술 기반 장건강 웰니스를 이끌다", image: "/news/thumb/168027347.webp", href: post("168027347") },
  { id: "168009336", date: "2025.10.29", title: "하드사이언스, 수원시와 7,050억 규모 바이오 투자 협약 참여", image: "/news/thumb/168009336.webp", href: post("168009336") },
  { id: "167895558", date: "2025.10.29", title: "하드사이언스, AI-바이오 융합 청년 인재 양성 본격 시작", image: "/news/thumb/167895558.webp", href: post("167895558") },
  { id: "167791543", date: "2025.09.16", title: "하드사이언스, 중소기업지원 자문단 바이오의료분과 포럼 진행", image: "/news/thumb/167791543.webp", href: post("167791543") },
  { id: "167789167", date: "2025.09.16", title: "하드사이언스, 광교 바이오허브 랩 스테이션 입주기업으로 선정", image: "/news/thumb/167789167.webp", href: post("167789167") },
  { id: "167671769", date: "2025.09.10", title: "하드사이언스, 그래핀 기반 치매 초기진단 임상 파트너 협약", image: "/news/thumb/167671769.webp", href: post("167671769") },
  { id: "167543041", date: "2025.09.03", title: "하드사이언스, 아주대 제3회 융복합세미나서 ECM 기반 3D 세포 연구 인사이트 제시", image: "/news/thumb/167543041.webp", href: post("167543041") },
  { id: "167542994", date: "2025.09.02", title: "수원대 창업보육센터, ‘WOW-BI IR 데모데이’ 성료", image: "/news/thumb/167542994.webp", href: post("167542994") },
  { id: "167010502", date: "2025.07.24", title: "🧬 하드사이언스, GG 바이오허브 창업경진대회 최우수상 수상", image: "/news/thumb/167010502.webp", href: post("167010502") },
  { id: "166617109", date: "2025.07.08", title: "하드사이언스, ‘2025 여성창업경진대회’ 입상 쾌거", image: "/news/thumb/166617109.webp", href: post("166617109") },
  { id: "166087150", date: "2025.06.25", title: "2025 MARS 화성특례시 AI Expo 하드사이언스 참가", image: "/news/thumb/166087150.webp", href: post("166087150") },
  { id: "164253422", date: "2025.05.23", title: "[2025 경기도 동반성장 페어 개최] 참석", image: "/news/thumb/164253422.webp", href: post("164253422") },
  { id: "161781118", date: "2025.04.18", title: "하드사이언스, 중소벤처기업부 '2024년 예비창업패키지' 최우수 기업 선정", image: "/news/thumb/161781118.webp", href: post("161781118") },
  { id: "161450745", date: "2025.04.14", title: "하드사이언스, SM국일그래핀과 치매 진단 기술 공동연구 협약 체결", image: "/news/thumb/161450745.webp", href: post("161450745") },
  { id: "154430915", date: "2025.02.26", title: "한경 JOB&JOY E매거진 321호 특집 – 하드사이언스, 혁신을 말하다", image: "/news/thumb/154430915.webp", href: post("154430915") },
  { id: "152736640", date: "2025.02.20", title: "『한국여성벤처협회 2024년 예비창업패키지 우수기업 CEO』 첨단 바이오 기술 활용한 3차원 배양 플랫폼 개발하는 ‘하드사이언스’", image: "/news/thumb/152736640.webp", href: post("152736640") },
  { id: "152542211", date: "2025.02.19", title: "하드사이언스 – 에딧미, 상호협력 업무 협약 체결", image: "/news/thumb/152542211.webp", href: post("152542211") },
  { id: "152534111", date: "2025.02.19", title: "수원대학교 창업보육센터 – 하드사이언스, 상호협력 업무 협약 체결", image: "/news/thumb/152534111.webp", href: post("152534111") },
  { id: "125391375", date: "2024.11.12", title: "2024년 세계 오가노이드 날 제정 기념 연례학술대회 참가", image: "/news/thumb/125391375.webp", href: post("125391375") },
  { id: "122883253", date: "2024.10.21", title: "우정바이오 YouTube : 랩클라우드의 장점! 꼭 입주해야 하는 이유?! (feat. 하드사이언스)", image: "/news/thumb/122883253.webp", href: post("122883253") },
  { id: "50378159", date: "2024.07.29", title: "OBS 특집 다큐 : [도시 人더스트리] 꿈꾸는 사람들의 도시 ‘화성’으로의 공간 여행", image: "/news/thumb/50378159.webp", href: post("50378159") },
]

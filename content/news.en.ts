import { newsKo } from "./news.ko"
import type { NewsItem } from "./types"

/**
 * 영문 뉴스 제목.
 *
 * 현행 영문 사이트(haddeng.imweb.me)의 뉴스 게시판은 비어 있어("No posts yet.") 영문
 * 원문이 존재하지 않는다. 따라서 한국어 제목을 번역했다.
 *
 * 주의: 링크(`href`)가 가리키는 원본 게시글 본문은 여전히 한국어다. 본문까지 영문화하려면
 * CMS 이관 시 게시글 단위로 번역 필드를 만들어야 한다.
 *
 * 날짜 · 썸네일 · 정렬은 `news.ko.ts` 를 그대로 재사용한다. 항목을 추가할 때는 두 파일의
 * id 가 어긋나지 않도록 news.ko.ts 를 먼저 고칠 것.
 */
const titles: Record<string, string> = {
  "172288285":
    "HADD Science takes the forum stage, seeking partners in 3D culture and organoid technology 👀",
  "172288167": "[BIO USA] HADD Science steps onto the world’s largest bio stage 🌍",
  "172288085":
    "🔥 On the ‘Innovation in Women's Health’ stage, HADD Science stands alongside global innovators",
  "172090251": "🧬 KASBP 2026 Spring Symposium",
  "172090197":
    "🎤 Aquillius ‘Symbiosyx’ pitch — HADD Science heads to the San Diego bio hub",
  "172090069":
    "🏆 Woochang Jung wins the grand prize at the GBSA on-the-job application case competition",
  "171780067":
    "🧬 HADD Science × Corestem Chemon join hands to co-develop an organoid platform!",
  "171397323": "Selected for the 2026 Bio Core project 🚀",
  "171402558":
    "[Grand prize] HADD Science’s Woochang Jung proves startup workflow innovation with the AI chatbot ‘Omnis’ 🤖",
  "171327290":
    "🧬 Advanced bio company HADD Science enters cosmeceuticals and regenerative medicine at once!",
  "171149202": "🧬 BIO KOREA 2026 × HADD Science",
  "170848929":
    "🧬 HADD Science wraps up the 3rd annual World Organoid Day conference!",
  "170366975": "HADD Science raids the Sunchang microbiome field! 🏃",
  "170335521":
    "ADDGEL unfolds the world map! 🌍 HADD Science × University of Suwon RISE ‘Global Export Academy’ field report ✈️",
  "170273004":
    "The high pass reshaping Hwaseong’s bio landscape — HADD Science × RISE",
  "170271833":
    "The future of animal testing: the ‘new standard in cell culture’ proposed by HADD Science",
  "169639982": "In a world where AI is everyday, the limits of technology have gone 🔭",
  "169044167": "HADD Science receives a commendation from the Mayor of Hwaseong! 🏆",
  "168928073":
    "🏆 HADD Science receives a commendation from the Gyeonggi Regional SMEs and Startups Administration",
  "168819369":
    "HADD Science wins the ✨grand prize✨ — Minister of SMEs and Startups Award at the 2025 Startup Incubating Competition 🏆",
  "168745762": "HADD Science at 2025 Makers Festa",
  "168671292": "🎉 2025 Hwaseong Startup Coming Day wraps up!",
  "168549942": "HADD Science × MJ Frontier sign a strategic MOU!",
  "168456431":
    "🔬 HADD Science presents its organoid culture platform at the organoid society booth!",
  "168284367": "✨ HADD Science completes its sponsorship of the KSEA symposium!",
  "168283066": "HADD Science joins the 2025 Gyeonggi Startup Summit (G-SUMMIT)",
  "168265042":
    "🚀 CEO Chaejung Heo takes the lectern at Pusan National University — ‘The convergence of bio and physics’ lecture wraps up",
  "168027347":
    "Partner company EditMe leads science-based gut health and wellness",
  "168009336":
    "HADD Science joins Suwon City’s KRW 705 billion bio investment agreement",
  "167895558":
    "HADD Science kicks off youth talent development in AI–bio convergence",
  "167791543":
    "HADD Science runs the bio-medical subcommittee forum of the SME support advisory group",
  "167789167":
    "HADD Science selected as a resident company of the Gwanggyo Bio Hub Lab Station",
  "167671769":
    "HADD Science signs a clinical partnership on graphene-based early dementia diagnosis",
  "167543041":
    "HADD Science shares ECM-based 3D cell research insights at Ajou University’s 3rd convergence seminar",
  "167542994":
    "University of Suwon Business Incubator wraps up the ‘WOW-BI IR Demo Day’",
  "167010502":
    "🧬 HADD Science wins the top prize at the GG Bio Hub startup competition",
  "166617109": "HADD Science places at the 2025 Women’s Startup Competition",
  "166087150": "HADD Science joins the 2025 MARS Hwaseong AI Expo",
  "164253422": "Attending the 2025 Gyeonggi Shared Growth Fair",
  "161781118":
    "HADD Science named a top company in the Ministry of SMEs and Startups’ 2024 Pre-Startup Package",
  "161450745":
    "HADD Science signs a joint research agreement with SM Kukil Graphene on dementia diagnosis technology",
  "154430915":
    "Hankyung JOB&JOY e-magazine issue 321 special — HADD Science on innovation",
  "152736640":
    "『KOVWA 2024 Pre-Startup Package top company CEO』 HADD Science, developing a 3D culture platform with advanced bio technology",
  "152542211": "HADD Science – EditMe sign a mutual cooperation agreement",
  "152534111":
    "University of Suwon Business Incubator – HADD Science sign a mutual cooperation agreement",
  "125391375":
    "Attending the 2024 annual conference marking World Organoid Day",
  "122883253":
    "Woojung Bio YouTube: the advantages of Lab Cloud — why you should move in (feat. HADD Science)",
  "50378159":
    "OBS documentary special: [City Industry] a journey through ‘Hwaseong’, the city of dreamers",
}

export const newsEn: NewsItem[] = newsKo.map((item) => ({
  ...item,
  title: titles[item.id] ?? item.title,
}))

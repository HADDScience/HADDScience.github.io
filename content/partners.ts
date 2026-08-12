import type { Lang } from "./types"

/**
 * 협력 파트너 로고 — haddscience.com 파트너 섹션에 실제로 실린 목록.
 *
 * 원본 사이트는 이 섹션을 로고 한 장(1920×2011 JPEG)으로 합쳐서 쓴다. 그래서
 * `scripts/split-partner-collage.mjs` 로 행·열 투영으로 잘라내고 흰 배경을
 * 알파로 바꿨다. 결과는 public/partners/site/ 에 있다.
 *
 * 목록이 바뀌면 원본 사이트의 콜라주를 다시 받아 스크립트를 돌리고 이 파일의 MAP
 * 순서를 맞춘다 (scripts 안의 MAP 주석 참고).
 *
 * public/partners/ 루트에는 사내 PPT(협력 파트너십(HRP)_260324.pptx)에서 뽑은 로고
 * 31개가 그대로 있다. 원본 사이트에 없는 기관이 다수라 지금은 쓰지 않지만, 나중에
 * 파트너 목록이 늘어나면 쓸 수 있어 지우지 않았다. 그쪽이 해상도가 더 높고 원색이다.
 */
export interface PartnerLogo {
  id: string
  src: string
  width: number
  height: number
  nameKo: string
  nameEn: string
}

export const partnerLogos: PartnerLogo[] = [
  { id: "mss", src: "/partners/site/mss.webp", width: 361, height: 71, nameKo: "중소벤처기업부", nameEn: "Ministry of SMEs and Startups" },
  { id: "msit", src: "/partners/site/msit.webp", width: 436, height: 75, nameKo: "과학기술정보통신부", nameEn: "Ministry of Science and ICT" },
  { id: "motie", src: "/partners/site/motie.webp", width: 162, height: 120, nameKo: "산업통상자원부", nameEn: "Ministry of Trade, Industry and Energy" },
  { id: "hwaseong", src: "/partners/site/hwaseong.webp", width: 248, height: 104, nameKo: "화성특례시", nameEn: "Hwaseong Special City" },
  { id: "gbsa", src: "/partners/site/gbsa.webp", width: 331, height: 118, nameKo: "경기도경제과학진흥원", nameEn: "Gyeonggi Business & Science Accelerator" },
  { id: "gyeonggi-bio-center", src: "/partners/site/gyeonggi-bio-center.webp", width: 419, height: 118, nameKo: "경기바이오센터", nameEn: "Gyeonggi Bio Center" },
  { id: "skku-bridge", src: "/partners/site/skku-bridge.webp", width: 262, height: 120, nameKo: "SKKU BRIDGE", nameEn: "SKKU BRIDGE" },
  { id: "skku", src: "/partners/site/skku.webp", width: 355, height: 84, nameKo: "성균관대학교", nameEn: "Sungkyunkwan University" },
  { id: "kbri", src: "/partners/site/kbri.webp", width: 210, height: 74, nameKo: "한국뇌연구원", nameEn: "Korea Brain Research Institute" },
  { id: "gachon-medicine", src: "/partners/site/gachon-medicine.webp", width: 415, height: 66, nameKo: "가천대학교 의과대학", nameEn: "Gachon University College of Medicine" },
  { id: "chungnam-medicine", src: "/partners/site/chungnam-medicine.webp", width: 273, height: 105, nameKo: "충남대학교 의과대학", nameEn: "Chungnam National University College of Medicine" },
  { id: "suwon", src: "/partners/site/suwon.webp", width: 235, height: 100, nameKo: "수원대학교", nameEn: "The University of Suwon" },
  { id: "jeonbuk", src: "/partners/site/jeonbuk.webp", width: 369, height: 89, nameKo: "전북대학교", nameEn: "Jeonbuk National University" },
  { id: "ajou", src: "/partners/site/ajou.webp", width: 375, height: 97, nameKo: "아주대학교", nameEn: "Ajou University" },
  { id: "snu", src: "/partners/site/snu.webp", width: 122, height: 120, nameKo: "서울대학교", nameEn: "Seoul National University" },
  { id: "ksmb", src: "/partners/site/ksmb.webp", width: 344, height: 91, nameKo: "한국마이크로바이옴학회", nameEn: "Korean Society for Microbiome" },
  { id: "msc-data-center", src: "/partners/site/msc-data-center.webp", width: 435, height: 86, nameKo: "제조서비스 융합 데이터 실증 연구센터", nameEn: "Manufacturing-Service Convergence Data Validation Research Center" },
  { id: "eas", src: "/partners/site/eas.webp", width: 235, height: 120, nameKo: "EAS", nameEn: "EAS Electronic Auto System" },
  { id: "chain", src: "/partners/site/chain.webp", width: 203, height: 112, nameKo: "CHAIN", nameEn: "CHAIN" },
  { id: "kh-medicare", src: "/partners/site/kh-medicare.webp", width: 678, height: 99, nameKo: "KH MEDICARE", nameEn: "KH MEDICARE" },
  { id: "jmr", src: "/partners/site/jmr.webp", width: 119, height: 120, nameKo: "JMR", nameEn: "JMR" },
  { id: "bonitolab", src: "/partners/site/bonitolab.webp", width: 345, height: 93, nameKo: "BONITOLAB", nameEn: "BONITOLAB" },
  { id: "woojung-bio", src: "/partners/site/woojung-bio.webp", width: 374, height: 120, nameKo: "우정바이오", nameEn: "Woojung Bio" },
  { id: "intelligent-solution", src: "/partners/site/intelligent-solution.webp", width: 340, height: 120, nameKo: "인텔리전트솔루션", nameEn: "intelligent solution" },
  { id: "leica", src: "/partners/site/leica.webp", width: 196, height: 120, nameKo: "라이카 마이크로시스템즈", nameEn: "Leica Microsystems" },
  { id: "curiosis", src: "/partners/site/curiosis.webp", width: 257, height: 43, nameKo: "CURIOSIS", nameEn: "CURIOSIS" },
  { id: "orient-bio", src: "/partners/site/orient-bio.webp", width: 252, height: 120, nameKo: "오리엔트바이오", nameEn: "Orient Bio" },
  { id: "organoid-society", src: "/partners/site/organoid-society.webp", width: 280, height: 120, nameKo: "The Organoid Society", nameEn: "The Organoid Society" },
  { id: "rise", src: "/partners/site/rise.webp", width: 217, height: 48, nameKo: "RISE사업단", nameEn: "RISE Project Group" },
]

/** 언어에 맞는 표기명으로 바꿔 준다. alt 텍스트에 쓴다. */
export function partnersFor(lang: Lang) {
  return partnerLogos.map(({ id, src, width, height, nameKo, nameEn }) => ({
    id,
    src,
    width,
    height,
    name: lang === "en" ? nameEn : nameKo,
  }))
}

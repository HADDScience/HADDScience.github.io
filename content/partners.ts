import type { Lang } from "./types"

/**
 * 협력 파트너 로고.
 *
 * 출처: NAS/HADD Science/99. 각종 발표 자료s/항목별  분할 모음/
 *       하(사업화,연혁,사업장)/협력 파트너십(HRP)_260324.pptx
 *
 * `scripts/extract-partner-logos.mjs` 가 pptx 에서 원본을 뽑아
 * public/partners/ 로 옮긴다. PPT 가 갱신되면 그 스크립트의 MEDIA 매핑을 고치고
 * 다시 돌린 뒤 이 파일을 재생성할 것.
 *
 * 이름은 로고 아트워크에 인쇄된 표기를 따랐다. 로고는 언어와 무관하게 같은 파일을
 * 쓰므로 목록을 여기 한 곳에 두고 alt 만 언어별로 고른다.
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
  { id: "skku", src: "/partners/skku.webp", width: 346, height: 98, nameKo: "성균관대학교", nameEn: "Sungkyunkwan University" },
  { id: "snu-medicine", src: "/partners/snu-medicine.webp", width: 274, height: 120, nameKo: "서울대학교 의과대학", nameEn: "Seoul National University College of Medicine" },
  { id: "kbri", src: "/partners/kbri.webp", width: 546, height: 114, nameKo: "한국뇌연구원", nameEn: "Korea Brain Research Institute" },
  { id: "ulsan", src: "/partners/ulsan.webp", width: 341, height: 67, nameKo: "울산대학교", nameEn: "University of Ulsan" },
  { id: "sm-kukil-graphene", src: "/partners/sm-kukil-graphene.webp", width: 333, height: 46, nameKo: "SM국일그래핀", nameEn: "SM Kukil Graphene" },
  { id: "biospero", src: "/partners/biospero.webp", width: 342, height: 116, nameKo: "BioSpero", nameEn: "BioSpero" },
  { id: "eas", src: "/partners/eas.webp", width: 235, height: 120, nameKo: "EAS Electronic Auto System", nameEn: "EAS Electronic Auto System" },
  { id: "gachon-medicine", src: "/partners/gachon-medicine.webp", width: 177, height: 30, nameKo: "가천대학교 의과대학", nameEn: "Gachon University College of Medicine" },
  { id: "dadalab", src: "/partners/dadalab.webp", width: 315, height: 120, nameKo: "DADALAB", nameEn: "DADALAB" },
  { id: "binaree", src: "/partners/binaree.webp", width: 120, height: 46, nameKo: "BINAREE", nameEn: "BINAREE" },
  { id: "chungnam-medicine", src: "/partners/chungnam-medicine.webp", width: 148, height: 54, nameKo: "충남대학교 의과대학", nameEn: "Chungnam National University College of Medicine" },
  { id: "kbio-company", src: "/partners/kbio-company.webp", width: 300, height: 65, nameKo: "KBIO COMPANY", nameEn: "KBIO COMPANY" },
  { id: "chain", src: "/partners/chain.webp", width: 113, height: 47, nameKo: "CHAIN", nameEn: "CHAIN" },
  { id: "kh-medicare", src: "/partners/kh-medicare.webp", width: 279, height: 38, nameKo: "KH MEDICARE", nameEn: "KH MEDICARE" },
  { id: "orient-bio", src: "/partners/orient-bio.webp", width: 242, height: 42, nameKo: "오리엔트바이오", nameEn: "Orient Bio" },
  { id: "glofle", src: "/partners/glofle.webp", width: 314, height: 120, nameKo: "glofle", nameEn: "glofle" },
  { id: "bonitolab", src: "/partners/bonitolab.webp", width: 136, height: 37, nameKo: "BONITOLAB", nameEn: "BONITOLAB" },
  { id: "ajou-hospital", src: "/partners/ajou-hospital.webp", width: 153, height: 54, nameKo: "아주대학교병원", nameEn: "Ajou University Hospital" },
  { id: "suwon", src: "/partners/suwon.webp", width: 236, height: 77, nameKo: "수원대학교", nameEn: "The University of Suwon" },
  { id: "mifi", src: "/partners/mifi.webp", width: 212, height: 30, nameKo: "발효미생물산업진흥원", nameEn: "Microbial Institute for Fermentation Industry" },
  { id: "woojung-bio", src: "/partners/woojung-bio.webp", width: 133, height: 45, nameKo: "우정바이오", nameEn: "Woojung Bio" },
  { id: "harvard-medical", src: "/partners/harvard-medical.svg", width: 291, height: 75, nameKo: "Harvard Medical School", nameEn: "Harvard Medical School" },
  { id: "houston-medicine", src: "/partners/houston-medicine.webp", width: 232, height: 48, nameKo: "University of Houston College of Medicine", nameEn: "University of Houston College of Medicine" },
  { id: "miami-miller", src: "/partners/miami-miller.svg", width: 410, height: 77, nameKo: "Miller School of Medicine, University of Miami", nameEn: "Miller School of Medicine, University of Miami" },
  { id: "nexel", src: "/partners/nexel.svg", width: 588, height: 120, nameKo: "NEXEL", nameEn: "NEXEL" },
  { id: "hanwha-solutions", src: "/partners/hanwha-solutions.svg", width: 1812, height: 544, nameKo: "한화솔루션", nameEn: "Hanwha Solutions" },
  { id: "jeju-veterinary", src: "/partners/jeju-veterinary.webp", width: 161, height: 72, nameKo: "제주대학교 수의학과", nameEn: "Jeju National University College of Veterinary Medicine" },
  { id: "harvard", src: "/partners/harvard.svg", width: 1123, height: 294, nameKo: "Harvard University", nameEn: "Harvard University" },
  { id: "boston", src: "/partners/boston.webp", width: 265, height: 120, nameKo: "Boston University", nameEn: "Boston University" },
  { id: "kist", src: "/partners/kist.svg", width: 519, height: 100, nameKo: "한국과학기술연구원", nameEn: "Korea Institute of Science and Technology" },
  { id: "meditec", src: "/partners/meditec.webp", width: 541, height: 120, nameKo: "메디텍", nameEn: "Meditec" },
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

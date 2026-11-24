import type { Lang } from "./types"

/**
 * 채용 공고 「일하게 될 곳」 사진. 사진 목록은 여기 한 곳에만 둔다 — 한국어 · 영어 공고가 같은 사진을 쓰고,
 * 글(alt · 캡션)만 언어별로 다르다.
 *
 * 사진 더하는 법: 긴 변 1600px 안팎 webp 로 줄여 `public/career/` 에 넣고, 아래 배열에 한 줄 더한다.
 * 순서가 화면 순서다. 다른 사람 얼굴이 크게 나오는 사진은 흐리게 하거나 빼고 넣는다.
 * 비율은 4:3 틀에 맞춰 보인다. 잘리면 안 되는 사진은 `fit: "contain"`.
 *
 * 2026-11-24: 라운지 · 공유오피스는 해상도와 구도 때문에 뺐다(사용자 의견). 원본은
 * `~/work/omnis-reports/career-photos-261124/`.
 */
const PHOTOS: {
  src: string
  fit?: "cover" | "contain"
  text: Record<Lang, { alt: string; caption: string }>
}[] = [
  {
    src: "/career/meeting-room.webp",
    text: {
      ko: { alt: "긴 테이블과 의자가 놓인 랩스테이션 회의실", caption: "광교 바이오허브 랩스테이션 회의실" },
      en: {
        alt: "Meeting room at Lab Station with a long table and chairs",
        caption: "Meeting room, Lab Station, Gwanggyo Bio Hub",
      },
    },
  },
  {
    src: "/career/lab.webp",
    text: {
      ko: { alt: "실험대와 시약 선반, 냉장고가 있는 기초 바이오 실험실", caption: "광교 바이오허브 랩스테이션 실험실" },
      en: {
        alt: "Basic bio lab with benches, reagent shelves and a refrigerator",
        caption: "Lab, Lab Station, Gwanggyo Bio Hub",
      },
    },
  },
]

export function careerPhotos(lang: Lang) {
  return PHOTOS.map((p) => ({ src: p.src, fit: p.fit, ...p.text[lang] }))
}

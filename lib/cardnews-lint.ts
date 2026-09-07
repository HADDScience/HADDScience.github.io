/**
 * 렌더된 카드의 조판 검사.
 *
 * 글자 하나가 다음 줄로 홀로 떨어지면(고아 줄) 카드가 못나 보인다. 텍스트만 봐서는 알 수 없고
 * 실제로 그려진 줄을 읽어야 한다 — 서체·크기·박스 폭이 줄바꿈을 정하기 때문이다.
 * 그래서 DOM 의 글자별 사각형을 모아 줄로 묶고, 마지막 줄이 너무 짧으면 알린다.
 *
 * 편집기 미리보기의 경고와, 옛 카드뉴스를 새 레이아웃으로 다시 쓰는 자동 반복이 같은 기준을 쓴다.
 */

/** 검사할 텍스트 요소와 사람이 읽을 이름. */
const TARGETS: [selector: string, label: string][] = [
  [".headline", "제목"],
  [".big", "제목"],
  [".subtitle", "부제"],
  [".body", "본문"],
  [".footnote", "각주"],
  [".quote", "인용문"],
  [".attrib", "이름"],
  [".list-title", "항목 제목"],
  [".list-desc", "항목 설명"],
  [".stat-label", "지표 이름"],
  [".cover-title", "표지 제목"],
]

/** 마지막 줄이 이 글자 수 이하이면 무조건 고아 줄. */
export const ORPHAN_MAX_CHARS = 2
/** 문단의 마지막 줄 폭이 그 문단에서 가장 긴 줄의 이 비율보다 짧으면 고아 줄. */
export const ORPHAN_MAX_RATIO = 0.35

export interface LayoutIssue {
  kind: "orphan" | "overflow"
  /** 어느 칸인지 */
  label: string
  /** 사람이 읽을 설명 */
  message: string
  /** 홀로 남은 글자(고아 줄일 때). 자동 수정이 이 문자열로 자리를 찾는다. */
  tail?: string
}

interface Line {
  text: string
  left: number
  right: number
}

/**
 * 요소 안의 글자를 실제 줄 단위로 묶는다. 줄바꿈은 rect 의 세로 위치가 정한다.
 * 사용자가 넣은 줄바꿈(`<br>`)마다 문단을 나눈다 — 문단 안에서 저절로 꺾인 줄만 고아 판정 대상이다.
 */
function readParagraphs(el: HTMLElement): Line[][] {
  const doc = el.ownerDocument
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  const paragraphs: Map<number, Line>[] = [new Map()]
  const range = doc.createRange()
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as Element).tagName === "BR") paragraphs.push(new Map())
      continue
    }
    const text = node.textContent ?? ""
    const lines = paragraphs[paragraphs.length - 1]
    for (let i = 0; i < text.length; i++) {
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      const rect = range.getClientRects()[0]
      if (!rect || rect.height === 0) continue
      // 미리보기는 transform 으로 축소돼 있어 top 값이 작다. 줄 높이의 절반 단위로 묶는다.
      const key = Math.round(rect.top / Math.max(rect.height / 2, 1))
      const line = lines.get(key)
      if (line) {
        line.text += text[i]
        line.left = Math.min(line.left, rect.left)
        line.right = Math.max(line.right, rect.right)
      } else lines.set(key, { text: text[i], left: rect.left, right: rect.right })
    }
  }
  return paragraphs.map((m) =>
    [...m.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, l]) => ({ ...l, text: l.text.trim() }))
      .filter((l) => l.text.length > 0)
  )
}

/**
 * 카드 루트(`.cn-root`)를 받아 문제를 돌려준다.
 * - orphan: 저절로 두 줄 이상 꺾인 문단의 마지막 줄이 ORPHAN_MAX_CHARS 이하이거나,
 *   그 문단의 가장 긴 줄보다 ORPHAN_MAX_RATIO 배 이상 짧음 (예: "& 투자포럼." 한 줄)
 * - overflow: `.card` 의 내용이 카드 높이를 넘음
 */
export function lintCard(root: HTMLElement): LayoutIssue[] {
  const issues: LayoutIssue[] = []
  const card = root.querySelector<HTMLElement>(".card")
  if (card && card.scrollHeight > card.clientHeight + 1) {
    issues.push({ kind: "overflow", label: "카드", message: "내용이 카드를 넘칩니다 — 문장을 줄이거나 사진 비율을 낮추세요." })
  }
  for (const [selector, label] of TARGETS) {
    for (const el of root.querySelectorAll<HTMLElement>(selector)) {
      if (el.classList.contains("placeholder")) continue
      for (const lines of readParagraphs(el)) {
        if (lines.length < 2) continue
        const last = lines[lines.length - 1]
        const chars = last.text.replace(/\s/g, "").length
        const widest = Math.max(...lines.map((l) => l.right - l.left))
        const short = chars <= ORPHAN_MAX_CHARS || last.right - last.left < widest * ORPHAN_MAX_RATIO
        if (chars > 0 && short) {
          issues.push({
            kind: "orphan",
            label,
            tail: last.text,
            message: `${label}의 마지막 줄에 "${last.text}" 만 남았습니다 — 문장을 고치거나 줄바꿈을 옮기세요.`,
          })
        }
      }
    }
  }
  return issues
}

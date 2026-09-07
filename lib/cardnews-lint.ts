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

/** 마지막 줄이 이 글자 수 이하이면 고아 줄로 본다(공백 제외). */
export const ORPHAN_MAX_CHARS = 2

export interface LayoutIssue {
  kind: "orphan" | "overflow"
  /** 어느 칸인지 */
  label: string
  /** 사람이 읽을 설명 */
  message: string
}

/** 요소 안의 글자를 실제 줄 단위로 묶는다. 줄바꿈은 rect 의 세로 위치가 정한다. */
function readLines(el: HTMLElement): string[] {
  const doc = el.ownerDocument
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const lines = new Map<number, string>()
  const range = doc.createRange()
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? ""
    for (let i = 0; i < text.length; i++) {
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      const rect = range.getClientRects()[0]
      if (!rect || rect.height === 0) continue
      // 미리보기는 transform 으로 축소돼 있어 top 값이 작다. 정수로 묶으면 같은 줄이 갈라질 수
      // 있으므로 줄 높이의 절반 단위로 묶는다.
      const key = Math.round(rect.top / Math.max(rect.height / 2, 1))
      lines.set(key, (lines.get(key) ?? "") + text[i])
    }
  }
  return [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([, t]) => t.trim())
}

/**
 * 카드 루트(`.cn-root`)를 받아 문제를 돌려준다.
 * - orphan: 두 줄 이상인 텍스트의 마지막 줄이 ORPHAN_MAX_CHARS 이하
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
      const lines = readLines(el)
      if (lines.length < 2) continue
      const last = lines[lines.length - 1].replace(/\s/g, "")
      if (last.length > 0 && last.length <= ORPHAN_MAX_CHARS) {
        issues.push({
          kind: "orphan",
          label,
          message: `${label}의 마지막 줄에 "${lines[lines.length - 1]}" 만 남았습니다 — 문장을 고치거나 줄바꿈을 옮기세요.`,
        })
      }
    }
  }
  return issues
}

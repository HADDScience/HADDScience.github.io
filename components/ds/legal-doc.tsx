import type { LegalDoc as Doc, LegalSection } from "@/content/types"

/**
 * 약관·개인정보처리방침을 그린다. 두 문서가 같은 모양이라 렌더러도 하나다.
 *
 * 본문 폭은 `Container narrow` 가 잡고, 여기서는 절의 위계만 만든다. 표는 좁은 화면에서
 * 가로로 넘치게 두고 스크롤을 준다 — 칸을 줄여 글자를 겹치게 하느니 옆으로 미는 편이
 * 읽힌다. 조항은 잘리면 안 되는 글이다.
 */
export function LegalDocument({
  doc,
  effectiveLabel,
}: {
  doc: Doc
  effectiveLabel: string
}) {
  return (
    // `break-keep` 은 한국어 낱말이 칸 안에서 쪼개지지 않게 한다 — 이것이 없으면 좁은 칸에서
    // "접수일로부터 3 / 년" 처럼 끊긴다. 카드뉴스가 `word-break: keep-all` 을 쓰는 것과 같다.
    <article className="grid gap-10 break-keep">
      <div className="grid gap-4">
        <p className="text-sm font-semibold text-muted-foreground">
          {effectiveLabel} {doc.effectiveFrom}
        </p>
        <p className="text-base leading-relaxed">{doc.intro}</p>
      </div>

      {doc.sections.map((section) => (
        <Section key={section.title} section={section} />
      ))}
    </article>
  )
}

function Section({ section }: { section: LegalSection }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-lg font-bold">{section.title}</h2>

      {section.paragraphs?.map((p) => (
        <p key={p} className="text-sm leading-relaxed text-muted-foreground">
          {p}
        </p>
      ))}

      {section.table ? (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {section.table.head.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-3 text-left align-top font-semibold whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row) => (
                <tr key={row.join("|")} className="border-b border-border/60 last:border-0">
                  {row.map((cell) => (
                    <td
                      key={cell}
                      className="px-3 py-3 align-top leading-relaxed text-muted-foreground"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {section.list ? (
        <ul className="grid gap-2">
          {section.list.map((item) => (
            <li
              key={item}
              className="relative pl-4 text-sm leading-relaxed text-muted-foreground before:absolute before:top-[0.6em] before:left-0 before:size-1 before:rounded-full before:bg-muted-foreground/60"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

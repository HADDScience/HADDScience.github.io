/**
 * 관리 화면의 숫자 타일 하나. 콘텐츠 현황과 사이트 통계가 같이 쓴다.
 *
 * 한글 라벨에 font-mono + 넓은 자간을 쓰지 않는다 — 자간만 벌어지고 서체는 폴백으로
 * 떨어져 읽기 나쁘다. 숫자와 날짜만 tabular-nums 로 자리를 맞춘다.
 */
export function StatTile({
  value,
  unit,
  label,
  note,
}: {
  value: string
  unit: string
  label: string
  note: string
}) {
  return (
    <div className="min-w-0 rounded-[12px] bg-muted/50 px-4 py-3">
      <p className="truncate text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-[-0.02em] tabular-nums">
          {value}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground tabular-nums">
        {note}
      </p>
    </div>
  )
}

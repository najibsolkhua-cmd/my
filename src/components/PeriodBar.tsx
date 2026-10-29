import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Period, PeriodKind } from '../lib/stats'

const KINDS: { key: PeriodKind; label: string }[] = [
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'year', label: 'Год' },
  { key: 'all', label: 'Всё' },
]

export function PeriodBar({ value, onChange, label }: { value: Period; onChange: (p: Period) => void; label: string }) {
  return (
    <div className="period">
      <div className="seg">
        {KINDS.map((k) => (
          <button key={k.key} className={value.kind === k.key ? 'on' : ''} onClick={() => onChange({ kind: k.key, offset: 0 })}>
            {k.label}
          </button>
        ))}
      </div>
      {value.kind !== 'all' && (
        <div className="period-nav">
          <button className="icon-btn sm" onClick={() => onChange({ ...value, offset: value.offset - 1 })} aria-label="Предыдущий период">
            <ChevronLeft size={18} />
          </button>
          <span>{label}</span>
          <button className="icon-btn sm" disabled={value.offset >= 0} onClick={() => onChange({ ...value, offset: value.offset + 1 })} aria-label="Следующий период">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

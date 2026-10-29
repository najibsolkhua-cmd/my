import { addDays, today } from '../lib/dates'

export function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = today()
  const y = addDays(t, -1)
  return (
    <div className="date-field">
      <button type="button" className={`chip ${value === t ? 'on' : ''}`} onClick={() => onChange(t)}>
        Сегодня
      </button>
      <button type="button" className={`chip ${value === y ? 'on' : ''}`} onClick={() => onChange(y)}>
        Вчера
      </button>
      <input type="date" className="input" value={value} max={t} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label="Дата" />
    </div>
  )
}

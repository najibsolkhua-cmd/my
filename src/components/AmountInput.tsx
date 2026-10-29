import { formatAmountInput } from '../lib/format'

export function AmountInput({ value, onChange, autoFocus, tone }: { value: string; onChange: (v: string) => void; autoFocus?: boolean; tone?: 'plus' | 'minus' }) {
  return (
    <label className={`amount ${tone ?? ''}`}>
      <input
        inputMode="decimal"
        placeholder="0"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(formatAmountInput(e.target.value))}
        aria-label="Сумма"
      />
      <span>₽</span>
    </label>
  )
}

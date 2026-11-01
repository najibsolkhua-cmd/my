import { useState } from 'react'
import { AmountInput } from '../components/AmountInput'
import { Sheet } from '../components/Sheet'
import { formatAmountInput, parseAmount } from '../lib/format'
import { useStore } from '../store'
import { useUI } from '../ui'

/** Стартовый капитал — деньги, которые были до начала учёта. */
export function CapitalForm() {
  const current = useStore((s) => s.startCapital)
  const { close, showToast } = useUI.getState()
  const [amount, setAmount] = useState(current ? formatAmountInput(String(current).replace('.', ',')) : '')
  const value = amount.trim() === '' ? 0 : parseAmount(amount)
  const valid = Number.isFinite(value) && value >= 0

  const save = () => {
    if (!valid) return
    useStore.getState().setStartCapital(value)
    showToast(value ? 'Стартовый капитал сохранён' : 'Стартовый капитал убран')
    close()
  }

  return (
    <Sheet
      title="Стартовый капитал"
      footer={
        <button className="btn primary wide" disabled={!valid} onClick={save}>
          Сохранить
        </button>
      }
    >
      <p className="sheet-text">Сколько денег у тебя было до того, как ты начал вести учёт. Эта сумма входит в «На счету», а доходы и расходы прибавляются к ней.</p>
      <AmountInput value={amount} onChange={setAmount} autoFocus />
      <p className="muted sheet-text">Можно изменить в любой момент. Чтобы убрать — оставь поле пустым.</p>
    </Sheet>
  )
}

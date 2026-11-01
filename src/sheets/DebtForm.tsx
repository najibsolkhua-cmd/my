import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { AmountInput } from '../components/AmountInput'
import { Field } from '../components/Field'
import { Sheet } from '../components/Sheet'
import { formatAmountInput, money, parseAmount, plural } from '../lib/format'
import { debtStatus } from '../lib/money'
import { useStore } from '../store'
import type { Debt } from '../types'
import { useUI } from '../ui'

export function DebtForm({ edit }: { edit?: Debt }) {
  const expenses = useStore((s) => s.expenses)
  const { addDebt, updateDebt, deleteDebt } = useStore.getState()
  const { close, showToast, ask } = useUI.getState()
  const [title, setTitle] = useState(edit?.title ?? '')
  const [amount, setAmount] = useState(edit ? formatAmountInput(String(edit.amount).replace('.', ',')) : '')
  const value = parseAmount(amount)
  const valid = title.trim().length > 0 && value > 0
  const st = edit ? debtStatus(edit, expenses) : null

  const save = () => {
    if (!valid) return
    if (edit) updateDebt(edit.id, { title: title.trim(), amount: value })
    else addDebt({ title: title.trim(), amount: value })
    showToast(edit ? 'Долг обновлён' : 'Долг записан')
    close()
  }

  const remove = async () => {
    if (!edit) return
    const text = st?.payments
      ? `${st.payments} ${plural(st.payments, ['платёж', 'платежа', 'платежей'])} по нему останутся в расходах как обычные траты.`
      : 'Это действие нельзя отменить.'
    if (await ask({ title: `Удалить долг «${edit.title}»?`, text, ok: 'Удалить', danger: true })) {
      deleteDebt(edit.id)
      showToast('Долг удалён')
      close()
    }
  }

  return (
    <Sheet
      title={edit ? 'Долг' : 'Новый долг'}
      footer={
        <>
          {edit && (
            <button className="btn ghost square" onClick={remove} aria-label="Удалить">
              <Trash2 size={20} />
            </button>
          )}
          <button className="btn primary wide" disabled={!valid} onClick={save}>
            {edit ? 'Сохранить' : 'Записать долг'}
          </button>
        </>
      }
    >
      <AmountInput value={amount} onChange={setAmount} autoFocus={!edit} tone="minus" />
      <Field label="За что">
        <input className="input" placeholder="Например: кредит за телефон, занял у Саши" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} />
      </Field>
      {st && (
        <p className="sheet-text muted">
          Погашено {money(st.paid)} из {money(st.debt.amount)}
          {st.closed ? ' — долг закрыт 🎉' : `, осталось ${money(st.left)}`}
        </p>
      )}
      <p className="sheet-text muted">Чтобы погасить часть долга, запиши расход и отметь «В счёт долга» — сумма спишется автоматически.</p>
    </Sheet>
  )
}

import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AmountInput } from '../components/AmountInput'
import { DateField } from '../components/DateField'
import { Field } from '../components/Field'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { today } from '../lib/dates'
import { formatAmountInput, money, parseAmount } from '../lib/format'
import { debtStatus } from '../lib/money'
import { DEBT_CATEGORY, useStore } from '../store'
import type { Expense } from '../types'
import { useUI } from '../ui'

export function ExpenseForm({ edit, categoryId: initialCategory, debtId: initialDebt, amount: initialAmount }: { edit?: Expense; categoryId?: string; debtId?: string; amount?: number }) {
  const categories = useStore((s) => s.categories)
  const debts = useStore((s) => s.debts)
  const expenses = useStore((s) => s.expenses)
  const { addExpense, updateExpense, deleteExpense } = useStore.getState()
  const { close, showToast, ask, open } = useUI.getState()

  const [debtId, setDebtId] = useState(edit?.debtId ?? initialDebt ?? '')
  const [categoryId, setCategoryId] = useState(edit?.categoryId ?? initialCategory ?? (initialDebt ? DEBT_CATEGORY : ''))
  const startAmount = edit?.amount ?? initialAmount
  const [amount, setAmount] = useState(startAmount ? formatAmountInput(String(startAmount).replace('.', ',')) : '')
  // долги, которые ещё не закрыты (без учёта этого же платежа при редактировании)
  const others = useMemo(() => expenses.filter((x) => x.id !== edit?.id), [expenses, edit?.id])
  const openDebts = debts.map((d) => debtStatus(d, others)).filter((d) => !d.closed || d.debt.id === debtId)
  const [date, setDate] = useState(edit?.date ?? today())
  const [note, setNote] = useState(edit?.note ?? '')

  const value = parseAmount(amount)
  const valid = !!categoryId && value > 0

  const save = () => {
    if (!valid) return
    const data = { categoryId, amount: value, date, note: note.trim() || undefined, debtId: debtId || undefined }
    if (edit) updateExpense(edit.id, data)
    else addExpense(data)
    const debt = openDebts.find((d) => d.debt.id === debtId)
    if (debt && !debt.closed && value >= debt.left) showToast(`Долг «${debt.debt.title}» погашен 🎉`)
    else if (debt) showToast(`−${amount} ₽ в счёт долга · осталось ${money(Math.max(0, debt.left - value))}`)
    else showToast(edit ? 'Сохранено' : `−${amount} ₽ записано`)
    close()
  }

  const remove = async () => {
    if (!edit) return
    if (await ask({ title: 'Удалить расход?', text: 'Это действие нельзя отменить.', ok: 'Удалить', danger: true })) {
      deleteExpense(edit.id)
      showToast('Расход удалён')
      close()
    }
  }

  return (
    <Sheet
      title={edit ? 'Расход' : 'Новый расход'}
      footer={
        <>
          {edit && (
            <button className="btn ghost square" onClick={remove} aria-label="Удалить">
              <Trash2 size={20} />
            </button>
          )}
          <button className="btn primary wide" disabled={!valid} onClick={save}>
            {edit ? 'Сохранить' : categoryId ? 'Записать расход' : 'Выбери категорию'}
          </button>
        </>
      }
    >
      <AmountInput value={amount} onChange={setAmount} autoFocus={!edit && !!initialCategory} tone="minus" />
      {openDebts.length > 0 && (
        <Field label="В счёт долга" hint={debtId ? 'спишется с долга' : 'необязательно'}>
          <div className="chips">
            {openDebts.map((d) => (
              <button
                key={d.debt.id}
                className={`chip ${debtId === d.debt.id ? 'on' : ''}`}
                onClick={() => {
                  const next = debtId === d.debt.id ? '' : d.debt.id
                  setDebtId(next)
                  if (next && !categoryId) setCategoryId(DEBT_CATEGORY)
                }}
              >
                {d.debt.title} · {money(d.left)}
              </button>
            ))}
          </div>
        </Field>
      )}
      <Field label="Категория">
        <div className="cat-grid">
          {categories.map((c) => (
            <button key={c.id} className={`cat ${categoryId === c.id ? 'on' : ''}`} onClick={() => setCategoryId(c.id)} style={{ ['--c' as string]: c.color }}>
              <span className="cat-icon">
                <Icon name={c.icon} size={20} />
              </span>
              <span className="cat-name">{c.name}</span>
            </button>
          ))}
          <button className="cat" onClick={() => open({ type: 'category', onSaved: setCategoryId })}>
            <span className="cat-icon add">
              <Plus size={20} />
            </span>
            <span className="cat-name">Своя</span>
          </button>
        </div>
      </Field>
      <Field label="Дата">
        <DateField value={date} onChange={setDate} />
      </Field>
      <Field label="Заметка">
        <input className="input" placeholder="Например: обед с коллегами" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
      </Field>
    </Sheet>
  )
}

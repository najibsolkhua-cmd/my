import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { AmountInput } from '../components/AmountInput'
import { DateField } from '../components/DateField'
import { Field } from '../components/Field'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { today } from '../lib/dates'
import { formatAmountInput, parseAmount } from '../lib/format'
import { useStore } from '../store'
import type { Expense } from '../types'
import { useUI } from '../ui'

export function ExpenseForm({ edit, categoryId: initialCategory }: { edit?: Expense; categoryId?: string }) {
  const categories = useStore((s) => s.categories)
  const { addExpense, updateExpense, deleteExpense } = useStore.getState()
  const { close, showToast, ask, open } = useUI.getState()

  const [categoryId, setCategoryId] = useState(edit?.categoryId ?? initialCategory ?? '')
  const [amount, setAmount] = useState(edit ? formatAmountInput(String(edit.amount).replace('.', ',')) : '')
  const [date, setDate] = useState(edit?.date ?? today())
  const [note, setNote] = useState(edit?.note ?? '')

  const value = parseAmount(amount)
  const valid = !!categoryId && value > 0

  const save = () => {
    if (!valid) return
    const data = { categoryId, amount: value, date, note: note.trim() || undefined }
    if (edit) updateExpense(edit.id, data)
    else addExpense(data)
    showToast(edit ? 'Сохранено' : `−${amount} ₽ записано`)
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

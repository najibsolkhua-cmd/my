import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { AmountInput } from '../components/AmountInput'
import { Field } from '../components/Field'
import { Sheet } from '../components/Sheet'
import { GOAL_KINDS } from '../lib/goals'
import { formatAmountInput, parseAmount } from '../lib/format'
import { useStore } from '../store'
import type { Goal, GoalKind } from '../types'
import { useUI } from '../ui'

export function GoalForm({ edit }: { edit?: Goal }) {
  const { addGoal, updateGoal, deleteGoal } = useStore.getState()
  const { close, showToast, ask } = useUI.getState()
  const [title, setTitle] = useState(edit?.title ?? '')
  const [kind, setKind] = useState<GoalKind>(edit?.kind ?? 'week')
  const [amount, setAmount] = useState(edit ? formatAmountInput(String(edit.target)) : '')
  const value = parseAmount(amount)
  const valid = value > 0

  const save = () => {
    if (!valid) return
    const fallback = kind === 'save' ? 'Накопить' : kind === 'week' ? 'Доход за неделю' : 'Доход за месяц'
    const data = { title: title.trim() || fallback, kind, target: value }
    if (edit) updateGoal(edit.id, data)
    else addGoal(data)
    showToast(edit ? 'Цель обновлена' : 'Цель поставлена')
    close()
  }

  const remove = async () => {
    if (!edit) return
    if (await ask({ title: 'Удалить цель?', ok: 'Удалить', danger: true })) {
      deleteGoal(edit.id)
      close()
    }
  }

  return (
    <Sheet
      title={edit ? 'Цель' : 'Новая цель'}
      footer={
        <>
          {edit && (
            <button className="btn ghost square" onClick={remove} aria-label="Удалить">
              <Trash2 size={20} />
            </button>
          )}
          <button className="btn primary wide" disabled={!valid} onClick={save}>
            {edit ? 'Сохранить' : 'Поставить цель'}
          </button>
        </>
      }
    >
      <Field label="Что считаем">
        <div className="kind-list">
          {GOAL_KINDS.map((k) => (
            <button key={k.key} className={`kind ${kind === k.key ? 'on' : ''}`} onClick={() => setKind(k.key)}>
              <b>{k.label}</b>
              <small>{k.hint}</small>
            </button>
          ))}
        </div>
      </Field>
      <AmountInput value={amount} onChange={setAmount} />
      <Field label="Название">
        <input className="input" placeholder="Например: на новый телефон" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} />
      </Field>
    </Sheet>
  )
}

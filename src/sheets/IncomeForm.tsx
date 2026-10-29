import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { AmountInput } from '../components/AmountInput'
import { DateField } from '../components/DateField'
import { Field } from '../components/Field'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { cardColor } from '../data/palette'
import { today } from '../lib/dates'
import { formatAmountInput, parseAmount } from '../lib/format'
import { useStore } from '../store'
import type { Income } from '../types'
import { useUI } from '../ui'

const QUICK_HOURS = [1, 2, 4, 6, 8, 12]

export function IncomeForm({ edit, sourceId: initialSource, minutes: initialMinutes }: { edit?: Income; sourceId?: string; minutes?: number }) {
  const sources = useStore((s) => s.sources)
  const { addIncome, updateIncome, deleteIncome } = useStore.getState()
  const { close, showToast, ask, open } = useUI.getState()
  const active = sources.filter((s) => !s.archived || s.id === edit?.sourceId || s.id === initialSource)

  const [sourceId, setSourceId] = useState(edit?.sourceId ?? initialSource ?? (active.length === 1 ? active[0].id : ''))
  const [amount, setAmount] = useState(edit ? formatAmountInput(String(edit.amount).replace('.', ',')) : '')
  const [date, setDate] = useState(edit?.date ?? today())
  const startMin = edit?.minutes ?? initialMinutes ?? 0
  const [hours, setHours] = useState(startMin ? String(Math.floor(startMin / 60)) : '')
  const [mins, setMins] = useState(startMin % 60 ? String(startMin % 60) : '')
  const [note, setNote] = useState(edit?.note ?? '')

  const value = parseAmount(amount)
  const minutes = (parseInt(hours) || 0) * 60 + (parseInt(mins) || 0)
  const valid = !!sourceId && value > 0

  const save = () => {
    if (!valid) return
    const data = { sourceId, amount: value, date, minutes, note: note.trim() || undefined }
    if (edit) updateIncome(edit.id, data)
    else addIncome(data)
    showToast(edit ? 'Сохранено' : `+${amount} ₽ записано`)
    close()
  }

  const remove = async () => {
    if (!edit) return
    if (await ask({ title: 'Удалить запись?', text: 'Это действие нельзя отменить.', ok: 'Удалить', danger: true })) {
      deleteIncome(edit.id)
      showToast('Запись удалена')
      close()
    }
  }

  if (!active.length) {
    return (
      <Sheet title="Новый доход">
        <div className="empty">
          <p>Сначала создай карту — источник дохода. Например, «Доставка» или «Такси».</p>
          <button className="btn primary wide" onClick={() => useUI.getState().replace({ type: 'source' })}>
            Создать карту
          </button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet
      title={edit ? 'Запись дохода' : 'Новый доход'}
      footer={
        <>
          {edit && (
            <button className="btn ghost square" onClick={remove} aria-label="Удалить">
              <Trash2 size={20} />
            </button>
          )}
          <button className="btn primary wide" disabled={!valid} onClick={save}>
            {edit ? 'Сохранить' : 'Записать доход'}
          </button>
        </>
      }
    >
      <Field label="Карта">
        <div className="pick-row">
          {active.map((s) => {
            const c = cardColor(s.color)
            return (
              <button key={s.id} className={`pick-card ${sourceId === s.id ? 'on' : ''}`} style={{ background: c.bg, color: c.ink }} onClick={() => setSourceId(s.id)}>
                <Icon name={s.icon} size={18} />
                <span>{s.name}</span>
              </button>
            )
          })}
          <button className="pick-card add" onClick={() => open({ type: 'source', onSaved: setSourceId })}>
            <Icon name="Sparkles" size={18} />
            <span>Новая</span>
          </button>
        </div>
      </Field>
      <AmountInput value={amount} onChange={setAmount} autoFocus={!edit} tone="plus" />
      <Field label="Сколько работал" hint={minutes ? `${Math.round(value / (minutes / 60)) || 0} ₽/ч` : 'необязательно'}>
        <div className="chips">
          {QUICK_HOURS.map((h) => (
            <button key={h} className={`chip ${minutes === h * 60 ? 'on' : ''}`} onClick={() => (setHours(String(h)), setMins(''))}>
              {h} ч
            </button>
          ))}
        </div>
        <div className="time-row">
          <label className="input-unit">
            <input className="input" inputMode="numeric" placeholder="0" value={hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            <span>ч</span>
          </label>
          <label className="input-unit">
            <input className="input" inputMode="numeric" placeholder="0" value={mins} onChange={(e) => setMins(String(Math.min(59, parseInt(e.target.value.replace(/\D/g, '')) || 0) || ''))} />
            <span>мин</span>
          </label>
        </div>
      </Field>
      <Field label="Дата">
        <DateField value={date} onChange={setDate} />
      </Field>
      <Field label="Заметка">
        <input className="input" placeholder="Например: 12 заказов, чаевые" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} />
      </Field>
    </Sheet>
  )
}

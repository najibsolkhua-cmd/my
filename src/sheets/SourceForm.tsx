import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Field } from '../components/Field'
import { Icon } from '../components/Icon'
import { IncomeCard } from '../components/IncomeCard'
import { Sheet } from '../components/Sheet'
import { SOURCE_TYPES } from '../data/defaults'
import { INCOME_ICONS } from '../data/icons'
import { CARD_COLORS, PATTERN_COUNT, cardColor } from '../data/palette'
import { CardPattern } from '../components/CardPattern'
import { plural } from '../lib/format'
import { workStats } from '../lib/stats'
import { useStore } from '../store'
import type { Source, SourceType } from '../types'
import { useUI } from '../ui'

export function SourceForm({ edit, onSaved }: { edit?: Source; onSaved?: (id: string) => void }) {
  const sources = useStore((s) => s.sources)
  const incomes = useStore((s) => s.incomes)
  const { addSource, updateSource, deleteSource } = useStore.getState()
  const { close, closeMany, showToast, ask } = useUI.getState()

  // Новой карте даём цвет, которого ещё нет в стопке.
  const freeColor = CARD_COLORS.find((c) => !sources.some((s) => s.color === c.key))?.key ?? CARD_COLORS[sources.length % CARD_COLORS.length].key
  const [name, setName] = useState(edit?.name ?? '')
  const [type, setType] = useState<SourceType>(edit?.type ?? 'side')
  const [icon, setIcon] = useState(edit?.icon ?? 'Bike')
  const [color, setColor] = useState(edit?.color ?? freeColor)
  const [pattern, setPattern] = useState(edit?.pattern ?? sources.length % PATTERN_COUNT)

  const own = edit ? incomes.filter((x) => x.sourceId === edit.id) : []
  const st = workStats(own)
  const valid = name.trim().length > 0

  const save = () => {
    if (!valid) return
    const data = { name: name.trim(), type, icon, color, pattern }
    if (edit) {
      updateSource(edit.id, data)
      showToast('Карта обновлена')
    } else {
      const id = addSource(data)
      onSaved?.(id)
      showToast('Карта создана')
    }
    close()
  }

  const closeWithDetail = () => {
    const layers = useUI.getState().layers
    const below = layers[layers.length - 2]
    if (below?.type === 'card' && below.sourceId === edit?.id) closeMany(2)
    else close()
  }

  const remove = async () => {
    if (!edit) return
    const text = own.length ? `Вместе с картой удалятся ${own.length} ${plural(own.length, ['запись', 'записи', 'записей'])} о доходе. Если хочешь сохранить историю — лучше отправь карту в архив.` : 'Это действие нельзя отменить.'
    if (await ask({ title: `Удалить «${edit.name}»?`, text, ok: 'Удалить', danger: true })) {
      deleteSource(edit.id)
      showToast('Карта удалена')
      closeWithDetail()
    }
  }

  const toggleArchive = () => {
    if (!edit) return
    updateSource(edit.id, { archived: !edit.archived })
    showToast(edit.archived ? 'Карта возвращена' : 'Карта в архиве')
    if (edit.archived) close()
    else closeWithDetail()
  }

  const c = cardColor(color)
  return (
    <Sheet
      title={edit ? 'Настройки карты' : 'Новая карта'}
      footer={
        <>
          {edit && (
            <>
              <button className="btn ghost square" onClick={remove} aria-label="Удалить карту">
                <Trash2 size={20} />
              </button>
              <button className="btn ghost square" onClick={toggleArchive} aria-label={edit.archived ? 'Вернуть из архива' : 'В архив'}>
                {edit.archived ? <ArchiveRestore size={20} /> : <Archive size={20} />}
              </button>
            </>
          )}
          <button className="btn primary wide" disabled={!valid} onClick={save}>
            {edit ? 'Сохранить' : 'Создать карту'}
          </button>
        </>
      }
    >
      <IncomeCard source={{ name: name || 'Название', type, icon, color, pattern }} total={st.total} minutes={st.minutes} rate={st.rate} className="preview" />
      <Field label="Название">
        <input className="input" placeholder="Доставка, Такси, Свой бизнес…" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} autoFocus={!edit} />
      </Field>
      <Field label="Тип">
        <div className="chips">
          {SOURCE_TYPES.map((t) => (
            <button key={t.key} className={`chip ${type === t.key ? 'on' : ''}`} onClick={() => setType(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Цвет">
        <div className="swatches">
          {CARD_COLORS.map((cc) => (
            <button key={cc.key} className={`swatch ${color === cc.key ? 'on' : ''}`} style={{ background: cc.bg }} onClick={() => setColor(cc.key)} aria-label={cc.key} />
          ))}
        </div>
      </Field>
      <Field label="Узор">
        <div className="patterns">
          {Array.from({ length: PATTERN_COUNT }, (_, i) => (
            <button key={i} className={`pattern ${pattern === i ? 'on' : ''}`} style={{ background: c.bg }} onClick={() => setPattern(i)} aria-label={`Узор ${i + 1}`}>
              <CardPattern pattern={i} color={c.accent} />
            </button>
          ))}
        </div>
      </Field>
      <Field label="Иконка">
        <div className="icon-grid">
          {INCOME_ICONS.map((n) => (
            <button key={n} className={`icon-pick ${icon === n ? 'on' : ''}`} onClick={() => setIcon(n)} aria-label={n}>
              <Icon name={n} size={22} />
            </button>
          ))}
        </div>
      </Field>
    </Sheet>
  )
}

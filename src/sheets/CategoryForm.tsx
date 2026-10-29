import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Field } from '../components/Field'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { EXPENSE_ICONS } from '../data/icons'
import { CATEGORY_COLORS } from '../data/palette'
import { useStore, FALLBACK_CATEGORY } from '../store'
import type { Category } from '../types'
import { useUI } from '../ui'

export function CategoryForm({ edit, onSaved }: { edit?: Category; onSaved?: (id: string) => void }) {
  const { addCategory, updateCategory, deleteCategory } = useStore.getState()
  const { close, showToast, ask } = useUI.getState()
  const [name, setName] = useState(edit?.name ?? '')
  const [icon, setIcon] = useState(edit?.icon ?? 'ShoppingBag')
  const [color, setColor] = useState(edit?.color ?? CATEGORY_COLORS[0])
  const valid = name.trim().length > 0

  const save = () => {
    if (!valid) return
    const data = { name: name.trim(), icon, color }
    if (edit) updateCategory(edit.id, data)
    else onSaved?.(addCategory(data))
    showToast(edit ? 'Категория обновлена' : 'Категория добавлена')
    close()
  }

  const remove = async () => {
    if (!edit) return
    if (await ask({ title: `Удалить «${edit.name}»?`, text: 'Расходы этой категории не пропадут — они перейдут в «Другое».', ok: 'Удалить', danger: true })) {
      deleteCategory(edit.id)
      showToast('Категория удалена')
      close()
    }
  }

  return (
    <Sheet
      title={edit ? 'Категория' : 'Новая категория'}
      footer={
        <>
          {edit && edit.id !== FALLBACK_CATEGORY && (
            <button className="btn ghost square" onClick={remove} aria-label="Удалить">
              <Trash2 size={20} />
            </button>
          )}
          <button className="btn primary wide" disabled={!valid} onClick={save}>
            {edit ? 'Сохранить' : 'Добавить'}
          </button>
        </>
      }
    >
      <div className="cat-preview">
        <span className="cat-icon big" style={{ ['--c' as string]: color }}>
          <Icon name={icon} size={30} />
        </span>
        <input className="input" placeholder="Название категории" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoFocus={!edit} />
      </div>
      <Field label="Цвет">
        <div className="swatches">
          {CATEGORY_COLORS.map((c) => (
            <button key={c} className={`swatch ${color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
          ))}
        </div>
      </Field>
      <Field label="Иконка">
        <div className="icon-grid">
          {EXPENSE_ICONS.map((n) => (
            <button key={n} className={`icon-pick ${icon === n ? 'on' : ''}`} onClick={() => setIcon(n)} aria-label={n} style={icon === n ? { background: color, color: '#fff' } : undefined}>
              <Icon name={n} size={22} />
            </button>
          ))}
        </div>
      </Field>
    </Sheet>
  )
}

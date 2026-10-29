import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { cardColor } from '../data/palette'
import { sourceTypeLabel } from '../data/defaults'
import { useStore } from '../store'
import { useUI } from '../ui'

export function PickSource({ purpose }: { purpose: 'shift' | 'income' }) {
  const sources = useStore((s) => s.sources).filter((x) => !x.archived)
  const pick = (id: string) => {
    const ui = useUI.getState()
    if (purpose === 'shift') {
      useStore.getState().startShift(id)
      ui.showToast(`Смена «${sources.find((s) => s.id === id)?.name}» началась`)
      ui.close()
    } else ui.replace({ type: 'income', sourceId: id })
  }
  return (
    <Sheet title={purpose === 'shift' ? 'На какой карте смена?' : 'Выбери карту'}>
      <div className="pick-list">
        {sources.map((s) => {
          const c = cardColor(s.color)
          return (
            <button key={s.id} className="pick-item" style={{ background: c.bg, color: c.ink }} onClick={() => pick(s.id)}>
              <Icon name={s.icon} size={22} />
              <b>{s.name}</b>
              <small>{sourceTypeLabel(s.type)}</small>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}

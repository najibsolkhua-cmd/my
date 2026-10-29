import { Square, X } from 'lucide-react'
import { cardColor } from '../data/palette'
import { clock, useNow } from '../hooks'
import { useStore } from '../store'
import { useUI } from '../ui'
import { Icon } from './Icon'

/** Плашка идущей смены с таймером. */
export function ShiftBanner() {
  const shift = useStore((s) => s.shift)
  const source = useStore((s) => s.sources.find((x) => x.id === s.shift?.sourceId))
  const now = useNow(1000)
  if (!shift || !source) return null
  const c = cardColor(source.color)

  const stop = () => {
    const res = useStore.getState().stopShift()
    if (res) useUI.getState().open({ type: 'income', sourceId: res.sourceId, minutes: res.minutes })
  }
  const cancel = async () => {
    if (await useUI.getState().ask({ title: 'Отменить смену?', text: 'Время не будет записано.', ok: 'Отменить смену', danger: true })) useStore.getState().cancelShift()
  }

  return (
    <div className="shift" style={{ ['--c' as string]: c.base }}>
      <span className="shift-icon" style={{ background: c.bg, color: c.ink }}>
        <Icon name={source.icon} size={20} />
      </span>
      <div className="shift-main">
        <small>
          <span className="live-dot" /> Идёт смена · {source.name}
        </small>
        <b>{clock(now - shift.startedAt)}</b>
      </div>
      <button className="icon-btn sm" onClick={cancel} aria-label="Отменить смену">
        <X size={16} />
      </button>
      <button className="btn primary sm" onClick={stop}>
        <Square size={14} fill="currentColor" /> Стоп
      </button>
    </div>
  )
}

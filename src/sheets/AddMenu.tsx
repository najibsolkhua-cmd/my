import { ArrowDownRight, ArrowUpRight, Layers, Play, Square } from 'lucide-react'
import { Sheet } from '../components/Sheet'
import { useStore } from '../store'
import { useUI } from '../ui'
import { useNow, clock } from '../hooks'

export function AddMenu() {
  const sources = useStore((s) => s.sources).filter((x) => !x.archived)
  const shift = useStore((s) => s.shift)
  const { replace } = useUI.getState()
  const now = useNow(1000)
  const shiftSource = useStore((s) => s.sources.find((x) => x.id === s.shift?.sourceId))

  const startShift = () => {
    if (shift) {
      const res = useStore.getState().stopShift()
      if (res) replace({ type: 'income', sourceId: res.sourceId, minutes: res.minutes })
      return
    }
    if (sources.length === 1) {
      useStore.getState().startShift(sources[0].id)
      useUI.getState().showToast(`Смена «${sources[0].name}» началась`)
      useUI.getState().close()
    } else if (sources.length > 1) replace({ type: 'pickSource', purpose: 'shift' })
    else replace({ type: 'source' })
  }

  return (
    <Sheet title="Добавить">
      <div className="add-grid">
        <button className="add-tile plus" onClick={() => replace({ type: 'income' })}>
          <ArrowUpRight size={26} />
          <b>Доход</b>
          <small>деньги пришли</small>
        </button>
        <button className="add-tile minus" onClick={() => replace({ type: 'expense' })}>
          <ArrowDownRight size={26} />
          <b>Расход</b>
          <small>деньги ушли</small>
        </button>
        <button className="add-tile" onClick={() => replace({ type: 'source' })}>
          <Layers size={26} />
          <b>Карта</b>
          <small>новый источник</small>
        </button>
        <button className={`add-tile ${shift ? 'live' : ''}`} onClick={startShift}>
          {shift ? <Square size={24} /> : <Play size={26} />}
          <b>{shift ? 'Завершить' : 'Смена'}</b>
          <small>{shift ? `${shiftSource?.name ?? ''} · ${clock(now - shift.startedAt)}` : 'засечь время'}</small>
        </button>
      </div>
    </Sheet>
  )
}

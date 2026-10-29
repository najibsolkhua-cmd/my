import { useEffect, useState } from 'react'
import { useStore } from '../store'
import type { Source } from '../types'
import { useUI } from '../ui'
import { IncomeCard } from './IncomeCard'
import type { WorkStats } from '../lib/stats'

const H = 212 // высота карты
const S = 58 // видимая полоска свёрнутой карты
const GAP = 12

/** Стопка карт как в кошельке: нажатие на полоску раскрывает карту, нажатие на раскрытую — открывает её. */
export function CardStack({ sources, stats }: { sources: Source[]; stats: Map<string, WorkStats> }) {
  const shift = useStore((s) => s.shift)
  const open = useUI((s) => s.open)
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (active >= sources.length) setActive(Math.max(0, sources.length - 1))
  }, [sources.length, active])

  const a = Math.min(active, sources.length - 1)
  const top = (i: number) => (i < a ? i * S : i === a ? a * S + (a ? GAP : 0) : a * S + (a ? GAP : 0) + H + GAP + (i - a - 1) * S)
  const last = sources.length - 1
  const height = sources.length ? top(last) + H : 0

  return (
    <div className="stack" style={{ height }}>
      {sources.map((s, i) => {
        const st = stats.get(s.id) ?? { total: 0, minutes: 0, rate: null, count: 0 }
        return (
          <IncomeCard
            key={s.id}
            source={s}
            total={st.total}
            minutes={st.minutes}
            rate={st.rate}
            live={shift?.sourceId === s.id}
            className={`stack-card ${i === a ? 'active' : ''}`}
            style={{ transform: `translateY(${top(i)}px) scale(${i === a ? 1 : 0.97})`, zIndex: i + 1 }}
            onClick={() => (i === a ? open({ type: 'card', sourceId: s.id }) : setActive(i))}
          />
        )
      })}
    </div>
  )
}

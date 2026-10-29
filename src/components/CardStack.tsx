import { ChevronsDownUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStore } from '../store'
import type { Source } from '../types'
import { useUI } from '../ui'
import { IncomeCard } from './IncomeCard'
import type { WorkStats } from '../lib/stats'

const H = 212 // высота карты
const S = 56 // видимая полоска карты в собранной стопке
const GAP = 12

/**
 * Стопка карт как в кошельке. По умолчанию собрана: видны полоски с названиями
 * и передняя карта. Нажатие раскрывает стопку, нажатие на карту открывает её историю.
 */
export function CardStack({ sources, stats }: { sources: Source[]; stats: Map<string, WorkStats> }) {
  const shift = useStore((s) => s.shift)
  const open = useUI((s) => s.open)
  const tab = useUI((s) => s.tab)
  const [expanded, setExpanded] = useState(false)
  // ушёл с вкладки — стопка снова собирается
  useEffect(() => {
    if (tab !== 'cards') setExpanded(false)
  }, [tab])

  const n = sources.length
  const single = n === 1
  const open1 = expanded || single
  const top = (i: number) => (open1 ? i * (H + GAP) : i * S)
  const height = n ? top(n - 1) + H : 0

  return (
    <>
      <div className={`stack ${open1 ? 'open' : 'closed'}`} style={{ height }}>
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
              className="stack-card"
              style={{ transform: `translate3d(0, ${top(i)}px, 0)`, zIndex: i + 1, transitionDelay: `${(open1 ? i : n - 1 - i) * 25}ms` }}
              onClick={() => (open1 ? open({ type: 'card', sourceId: s.id }) : setExpanded(true))}
            />
          )
        })}
      </div>
      {n > 1 && (
        <div className="stack-foot">
          {expanded ? (
            <>
              <span className="hint">Нажми на карту, чтобы открыть историю</span>
              <button className="btn ghost sm" onClick={() => setExpanded(false)}>
                <ChevronsDownUp size={16} /> Собрать
              </button>
            </>
          ) : (
            <span className="hint">Нажми на стопку, чтобы раскрыть</span>
          )}
        </div>
      )}
    </>
  )
}

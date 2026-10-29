import { ChevronDown, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CardStack } from '../components/CardStack'
import { Icon } from '../components/Icon'
import { PeriodBar } from '../components/PeriodBar'
import { cardColor } from '../data/palette'
import { useToday } from '../hooks'
import { hoursShort, money } from '../lib/format'
import { earliestDate, filterRange, periodRange, workStats, type Period, type WorkStats } from '../lib/stats'
import { useStore } from '../store'
import { useUI } from '../ui'

export function Cards() {
  const sources = useStore((s) => s.sources)
  const incomes = useStore((s) => s.incomes)
  const open = useUI((s) => s.open)
  const now = useToday()
  const [period, setPeriod] = useState<Period>({ kind: 'all', offset: 0 })
  const [showArchive, setShowArchive] = useState(false)

  const range = periodRange(period, now, earliestDate(incomes))
  const stats = useMemo(() => {
    const inc = filterRange(incomes, range)
    const m = new Map<string, WorkStats>()
    for (const s of sources) m.set(s.id, workStats(inc.filter((x) => x.sourceId === s.id)))
    return m
  }, [incomes, sources, range.start, range.end])

  const active = sources.filter((s) => !s.archived)
  const archived = sources.filter((s) => s.archived)
  const ranking = [...active].sort((a, b) => (stats.get(b.id)?.total ?? 0) - (stats.get(a.id)?.total ?? 0))
  const top = Math.max(1, ...ranking.map((s) => stats.get(s.id)?.total ?? 0))

  return (
    <div className="screen">
      <header className="top">
        <h1 className="title">Мои карты</h1>
        <button className="btn primary sm" onClick={() => open({ type: 'source' })}>
          <Plus size={16} /> Карта
        </button>
      </header>

      {active.length === 0 ? (
        <section className="panel empty">
          <Icon name="CreditCard" size={36} />
          <p>Каждый источник дохода — отдельная карта: работа, доставка, такси, свой проект или бизнес.</p>
          <button className="btn primary wide" onClick={() => open({ type: 'source' })}>
            Создать карту
          </button>
        </section>
      ) : (
        <>
          <PeriodBar value={period} onChange={setPeriod} label={range.label} />
          <CardStack sources={active} stats={stats} />
          <p className="hint">Нажми на карту, чтобы раскрыть её, и ещё раз — чтобы открыть историю</p>

          <section className="panel">
            <div className="panel-head">
              <h3>Что приносит больше</h3>
              <small className="muted">{range.label}</small>
            </div>
            <div className="rank">
              {ranking.map((s) => {
                const st = stats.get(s.id)!
                const c = cardColor(s.color)
                return (
                  <button key={s.id} className="rank-row" onClick={() => open({ type: 'card', sourceId: s.id })}>
                    <span className="op-icon" style={{ background: c.bg, color: c.ink }}>
                      <Icon name={s.icon} size={18} />
                    </span>
                    <span className="rank-main">
                      <span className="rank-line">
                        <b>{s.name}</b>
                        <b>{money(st.total)}</b>
                      </span>
                      <span className="rank-bar">
                        <i style={{ width: `${(st.total / top) * 100}%`, background: c.bg }} />
                      </span>
                      <span className="rank-line muted">
                        <small>{hoursShort(st.minutes)} работы</small>
                        <small>{st.rate !== null ? `${money(st.rate)} в час` : 'время не указано'}</small>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        </>
      )}

      {archived.length > 0 && (
        <section>
          <button className="archive-toggle" onClick={() => setShowArchive(!showArchive)}>
            Архив · {archived.length}
            <ChevronDown size={18} style={{ transform: showArchive ? 'rotate(180deg)' : undefined }} />
          </button>
          {showArchive && (
            <div className="pick-list">
              {archived.map((s) => {
                const c = cardColor(s.color)
                const st = stats.get(s.id)
                return (
                  <button key={s.id} className="pick-item archived" style={{ background: c.bg, color: c.ink }} onClick={() => open({ type: 'card', sourceId: s.id })}>
                    <Icon name={s.icon} size={22} />
                    <b>{s.name}</b>
                    <small>{money(st?.total ?? 0)}</small>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

import { ChevronLeft, Pencil, Play, Plus, Square } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BarChart } from '../components/BarChart'
import { IncomeCard } from '../components/IncomeCard'
import { PeriodBar } from '../components/PeriodBar'
import { usePaged } from '../components/ShowMore'
import { cardColor } from '../data/palette'
import { clock, useNow, useToday } from '../hooks'
import { humanDate, weekdayShort } from '../lib/dates'
import { duration, hoursShort, money, plural } from '../lib/format'
import { bucketTitle, currentBucket, earliestDate, filterRange, groupByDate, periodRange, workStats, type Period } from '../lib/stats'
import { useStore } from '../store'
import { useUI } from '../ui'

export function CardDetail({ sourceId }: { sourceId: string }) {
  const source = useStore((s) => s.sources.find((x) => x.id === sourceId))
  const allIncomes = useStore((s) => s.incomes)
  const shift = useStore((s) => s.shift)
  const { open, close } = useUI.getState()
  const today = useToday()
  const now = useNow(shift?.sourceId === sourceId ? 1000 : 60_000)
  const [period, setPeriod] = useState<Period>({ kind: 'month', offset: 0 })
  const [mode, setMode] = useState<'money' | 'hours'>('money')

  const incomes = useMemo(() => allIncomes.filter((x) => x.sourceId === sourceId), [allIncomes, sourceId])
  const range = periodRange(period, today, earliestDate(incomes))
  const inPeriod = useMemo(() => filterRange(incomes, range), [incomes, range.start, range.end])
  const st = workStats(inPeriod)
  const total = workStats(incomes)
  const groups = useMemo(() => groupByDate(inPeriod), [inPeriod])
  const { visible, more } = usePaged(groups, 10, `${period.kind}-${period.offset}`)

  if (!source) return null
  const c = cardColor(source.color)
  const live = shift?.sourceId === sourceId
  const busyElsewhere = !!shift && !live

  const toggleShift = () => {
    if (live) {
      const res = useStore.getState().stopShift()
      if (res) open({ type: 'income', sourceId: res.sourceId, minutes: res.minutes })
    } else if (!shift) {
      useStore.getState().startShift(sourceId)
      useUI.getState().showToast('Смена началась — удачи!')
    }
  }

  const values = range.buckets.map((b) => {
    const items = inPeriod.filter((x) => x.date >= b.start && x.date <= b.end)
    return mode === 'money' ? items.reduce((s, x) => s + x.amount, 0) : items.reduce((s, x) => s + x.minutes, 0) / 60
  })

  return (
    <div className="detail" style={{ ['--card' as string]: c.base }}>
      <header className="top detail-top">
        <button className="icon-btn" onClick={close} aria-label="Назад">
          <ChevronLeft size={22} />
        </button>
        <h1 className="title sm">{source.name}</h1>
        <button className="icon-btn" onClick={() => open({ type: 'source', edit: source })} aria-label="Настройки карты">
          <Pencil size={18} />
        </button>
      </header>

      <div className="screen">
        <IncomeCard source={source} total={total.total} minutes={total.minutes} rate={total.rate} live={live} />
        {source.archived && <p className="hint">Карта в архиве — она скрыта из стопки, но история сохранена.</p>}

        <div className="detail-actions">
          <button className={`btn ${live ? 'live' : 'ghost'} wide`} onClick={toggleShift} disabled={busyElsewhere}>
            {live ? (
              <>
                <Square size={16} fill="currentColor" /> Завершить · {clock(now - shift!.startedAt)}
              </>
            ) : (
              <>
                <Play size={18} /> {busyElsewhere ? 'Идёт другая смена' : 'Начать смену'}
              </>
            )}
          </button>
          <button className="btn primary wide" onClick={() => open({ type: 'income', sourceId })}>
            <Plus size={18} /> Доход
          </button>
        </div>

        <PeriodBar value={period} onChange={setPeriod} label={range.label} />

        <div className="tiles">
          <div className="tile">
            <small>Заработано</small>
            <b>{money(st.total)}</b>
          </div>
          <div className="tile">
            <small>Отработано</small>
            <b>{hoursShort(st.minutes)}</b>
          </div>
          <div className="tile">
            <small>В час</small>
            <b>{st.rate !== null ? money(st.rate) : '—'}</b>
          </div>
        </div>

        <section className="panel">
          <div className="panel-head">
            <h3>{mode === 'money' ? 'Доход' : 'Часы работы'}</h3>
            <div className="seg sm">
              <button className={mode === 'money' ? 'on' : ''} onClick={() => setMode('money')}>
                ₽
              </button>
              <button className={mode === 'hours' ? 'on' : ''} onClick={() => setMode('hours')}>
                Часы
              </button>
            </div>
          </div>
          <BarChart
            labels={range.buckets.map((b) => b.label)}
            titles={range.buckets.map((b) => bucketTitle(b, period.kind, today, humanDate))}
            current={currentBucket(range.buckets, today)}
            series={[{ name: mode === 'money' ? 'Доход' : 'Часы', color: c.base, values, format: mode === 'money' ? (v) => money(v) : (v) => duration(v * 60) }]}
          />
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>История</h3>
            <small className="muted">
              {st.count} {plural(st.count, ['запись', 'записи', 'записей'])}
            </small>
          </div>
          {groups.length === 0 && <p className="muted center pad">За этот период записей нет</p>}
          {visible.map(([date, items]) => {
            const day = workStats(items)
            return (
              <div key={date} className="day">
                <div className="day-head">
                  <span>
                    {humanDate(date, today)} <small className="muted">{weekdayShort(date)}</small>
                  </span>
                  <span className="muted">
                    {day.minutes ? `${hoursShort(day.minutes)} · ` : ''}
                    {money(day.total)}
                  </span>
                </div>
                {items.map((x) => (
                  <button key={x.id} className="entry" onClick={() => open({ type: 'income', edit: x })}>
                    <span className="entry-main">
                      <b className="plus-text">+{money(x.amount)}</b>
                      <small className="muted">{[x.minutes ? duration(x.minutes) : '', x.minutes ? `${money(x.amount / (x.minutes / 60))}/ч` : '', x.note].filter(Boolean).join(' · ') || 'без времени'}</small>
                    </span>
                    <Pencil size={14} className="muted" />
                  </button>
                ))}
              </div>
            )
          })}
          {more}
        </section>
      </div>
    </div>
  )
}

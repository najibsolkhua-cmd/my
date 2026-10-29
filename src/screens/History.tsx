import { ArrowDownRight, ArrowUpRight, ChevronLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { OpRow } from '../components/OpRow'
import { PeriodBar } from '../components/PeriodBar'
import { usePaged } from '../components/ShowMore'
import { cardColor } from '../data/palette'
import { useToday } from '../hooks'
import { humanDate, weekdayShort } from '../lib/dates'
import { money } from '../lib/format'
import { earliestDate, filterRange, groupByDate, periodRange, sum, type Period } from '../lib/stats'
import { useStore } from '../store'
import { useUI } from '../ui'

type Kind = 'all' | 'in' | 'out'

/** Вся история операций: фильтр, период и подгрузка по дням. */
export function History() {
  const incomes = useStore((s) => s.incomes)
  const expenses = useStore((s) => s.expenses)
  const sources = useStore((s) => s.sources)
  const categories = useStore((s) => s.categories)
  const { open, close } = useUI.getState()
  const now = useToday()
  const [kind, setKind] = useState<Kind>('all')
  const [period, setPeriod] = useState<Period>({ kind: 'month', offset: 0 })

  const range = periodRange(period, now, earliestDate(incomes, expenses))
  const inc = useMemo(() => filterRange(incomes, range), [incomes, range.start, range.end])
  const exp = useMemo(() => filterRange(expenses, range), [expenses, range.start, range.end])
  const ops = useMemo(
    () => [
      ...(kind !== 'out' ? inc.map((x) => ({ ...x, kind: 'in' as const, signed: x.amount })) : []),
      ...(kind !== 'in' ? exp.map((x) => ({ ...x, kind: 'out' as const, signed: -x.amount })) : []),
    ],
    [inc, exp, kind],
  )
  const groups = useMemo(() => groupByDate(ops), [ops])
  const { visible, more } = usePaged(groups, 10, `${kind}-${period.kind}-${period.offset}`)

  return (
    <div className="detail">
      <header className="top detail-top">
        <button className="icon-btn" onClick={close} aria-label="Назад">
          <ChevronLeft size={22} />
        </button>
        <h1 className="title sm">История</h1>
        <span style={{ width: 42 }} />
      </header>
      <div className="screen">
        <div className="seg">
          {(
            [
              ['all', 'Все'],
              ['in', 'Доходы'],
              ['out', 'Расходы'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
              {label}
            </button>
          ))}
        </div>
        <PeriodBar value={period} onChange={setPeriod} label={range.label} />
        <div className="hero-pills">
          <div className="pill plus">
            <ArrowUpRight size={16} />
            <span>
              <small>Доход</small>
              {money(sum(inc))}
            </span>
          </div>
          <div className="pill minus">
            <ArrowDownRight size={16} />
            <span>
              <small>Расход</small>
              {money(sum(exp))}
            </span>
          </div>
        </div>
        <section className="panel">
          {groups.length === 0 && <p className="muted center pad">За этот период операций нет</p>}
          {visible.map(([date, items]) => (
            <div key={date} className="day">
              <div className="day-head">
                <span>
                  {humanDate(date, now)} <small className="muted">{weekdayShort(date)}</small>
                </span>
                <span className="muted">{money(items.reduce((s, x) => s + x.signed, 0), true)}</span>
              </div>
              {items.map((x) => {
                if (x.kind === 'in') {
                  const s = sources.find((q) => q.id === x.sourceId)
                  const c = cardColor(s?.color ?? '')
                  return <OpRow key={x.id} icon={<Icon name={s?.icon ?? 'Coins'} size={18} />} color={c.bg} ink={c.ink} title={s?.name ?? 'Доход'} sub={x.note} minutes={x.minutes} amount={x.amount} onClick={() => open({ type: 'income', edit: x })} />
                }
                const c = categories.find((q) => q.id === x.categoryId)
                return <OpRow key={x.id} icon={<Icon name={c?.icon ?? 'Receipt'} size={18} />} color={c?.color ?? '#64748b'} title={c?.name ?? 'Расход'} sub={x.note} amount={-x.amount} onClick={() => open({ type: 'expense', edit: x })} />
              })}
            </div>
          ))}
          {more}
        </section>
      </div>
    </div>
  )
}

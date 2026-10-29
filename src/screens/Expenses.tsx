import { Check, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BarChart } from '../components/BarChart'
import { Donut } from '../components/Donut'
import { Icon } from '../components/Icon'
import { OpRow } from '../components/OpRow'
import { PeriodBar } from '../components/PeriodBar'
import { useToday } from '../hooks'
import { humanDate, weekdayShort } from '../lib/dates'
import { compact, money } from '../lib/format'
import { bucketSums, bucketTitle, currentBucket, earliestDate, filterRange, groupByDate, periodRange, sum, type Period } from '../lib/stats'
import { useStore } from '../store'
import { useUI } from '../ui'

export function Expenses() {
  const expenses = useStore((s) => s.expenses)
  const incomes = useStore((s) => s.incomes)
  const categories = useStore((s) => s.categories)
  const open = useUI((s) => s.open)
  const now = useToday()
  const [period, setPeriod] = useState<Period>({ kind: 'month', offset: 0 })
  const [editing, setEditing] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)

  const range = periodRange(period, now, earliestDate(expenses))
  const inPeriod = useMemo(() => filterRange(expenses, range), [expenses, range.start, range.end])
  const total = sum(inPeriod)
  const incTotal = sum(filterRange(incomes, range))

  const byCat = useMemo(() => {
    const m = new Map<string, number>()
    for (const x of inPeriod) m.set(x.categoryId, (m.get(x.categoryId) ?? 0) + x.amount)
    return m
  }, [inPeriod])
  const sorted = [...categories].filter((c) => byCat.get(c.id)).sort((a, b) => byCat.get(b.id)! - byCat.get(a.id)!)
  const visible = filter ? inPeriod.filter((x) => x.categoryId === filter) : inPeriod
  const groups = groupByDate(visible)
  const share = incTotal > 0 ? Math.round((total / incTotal) * 100) : null

  return (
    <div className="screen">
      <header className="top">
        <h1 className="title">Расходы</h1>
        <button className="btn primary sm" onClick={() => open({ type: 'expense' })}>
          <Plus size={16} /> Расход
        </button>
      </header>

      <PeriodBar value={period} onChange={setPeriod} label={range.label} />

      <section className="panel spend">
        <Donut parts={sorted.map((c) => ({ value: byCat.get(c.id)!, color: c.color }))} size={176}>
          <small>Потрачено</small>
          <b>{compact(total)} ₽</b>
          {share !== null && <small className="muted">{share}% дохода</small>}
        </Donut>
        <div className="legend">
          {sorted.length === 0 && <p className="muted">Пока нет расходов за этот период</p>}
          {sorted.slice(0, 5).map((c) => (
            <button key={c.id} className={`legend-row ${filter === c.id ? 'on' : ''}`} onClick={() => setFilter(filter === c.id ? null : c.id)}>
              <i style={{ background: c.color }} />
              <span>{c.name}</span>
              <b>{Math.round((byCat.get(c.id)! / total) * 100)}%</b>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h3>Категории</h3>
          <button className="link" onClick={() => setEditing(!editing)}>
            {editing ? (
              <>
                <Check size={16} /> Готово
              </>
            ) : (
              <>
                <Pencil size={14} /> Изменить
              </>
            )}
          </button>
        </div>
        <p className="hint left">{editing ? 'Нажми на категорию, чтобы изменить или удалить её' : 'Нажми на категорию, чтобы быстро записать расход'}</p>
        <div className="cat-grid">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`cat ${editing ? 'wiggle' : ''} ${filter === c.id ? 'on' : ''}`}
              style={{ ['--c' as string]: c.color }}
              onClick={() => (editing ? open({ type: 'category', edit: c }) : open({ type: 'expense', categoryId: c.id }))}
            >
              <span className="cat-icon">
                <Icon name={c.icon} size={20} />
              </span>
              <span className="cat-name">{c.name}</span>
              <span className="cat-sum">{byCat.get(c.id) ? compact(byCat.get(c.id)!) : ''}</span>
            </button>
          ))}
          <button className="cat" onClick={() => open({ type: 'category' })}>
            <span className="cat-icon add">
              <Plus size={20} />
            </span>
            <span className="cat-name">Своя</span>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Динамика</h3>
        </div>
        <BarChart
          labels={range.buckets.map((b) => b.label)}
          titles={range.buckets.map((b) => bucketTitle(b, period.kind, now, humanDate))}
          current={currentBucket(range.buckets, now)}
          series={[{ name: 'Расход', color: 'var(--minus)', values: bucketSums(visible, range.buckets), format: (v) => money(v) }]}
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>{filter ? categories.find((c) => c.id === filter)?.name : 'История'}</h3>
          {filter && (
            <button className="link" onClick={() => setFilter(null)}>
              Показать все
            </button>
          )}
        </div>
        {groups.length === 0 && <p className="muted center pad">Записей нет</p>}
        {groups.map(([date, items]) => (
          <div key={date} className="day">
            <div className="day-head">
              <span>
                {humanDate(date, now)} <small className="muted">{weekdayShort(date)}</small>
              </span>
              <span className="muted">−{money(sum(items))}</span>
            </div>
            {items.map((x) => {
              const c = categories.find((q) => q.id === x.categoryId)
              return <OpRow key={x.id} icon={<Icon name={c?.icon ?? 'Receipt'} size={18} />} color={c?.color ?? '#64748b'} title={c?.name ?? 'Расход'} sub={x.note} amount={-x.amount} onClick={() => open({ type: 'expense', edit: x })} />
            })}
          </div>
        ))}
      </section>
    </div>
  )
}

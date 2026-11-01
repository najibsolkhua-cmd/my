import { ArrowDownRight, ArrowUpRight, ChevronRight, HandCoins, Play, Settings as Gear } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BarChart } from '../components/BarChart'
import { Icon } from '../components/Icon'
import { IncomeCard } from '../components/IncomeCard'
import { LevelBadge } from '../components/LevelBadge'
import { LogoMark } from '../components/LogoMark'
import { OpRow } from '../components/OpRow'
import { PeriodBar } from '../components/PeriodBar'
import { Progress } from '../components/Progress'
import { ShiftBanner } from '../components/ShiftBanner'
import { cardColor } from '../data/palette'
import { useToday } from '../hooks'
import { humanDate } from '../lib/dates'
import { money, moneyParts } from '../lib/format'
import { levelProgress } from '../lib/levels'
import { bucketSums, bucketTitle, currentBucket, earliestDate, filterRange, last7, periodRange, sum, workStats, type Period } from '../lib/stats'
import { balanceOf, debtsSummary } from '../lib/money'
import { useStore } from '../store'
import { useUI } from '../ui'

export function Home() {
  const sources = useStore((s) => s.sources)
  const incomes = useStore((s) => s.incomes)
  const expenses = useStore((s) => s.expenses)
  const categories = useStore((s) => s.categories)
  const shift = useStore((s) => s.shift)
  const { open, setTab } = useUI.getState()
  const now = useToday()
  const [period, setPeriod] = useState<Period>({ kind: 'month', offset: 0 })

  const earliest = useMemo(() => earliestDate(incomes, expenses), [incomes, expenses])
  const range = periodRange(period, now, earliest)
  const inc = useMemo(() => filterRange(incomes, range), [incomes, range.start, range.end])
  const exp = useMemo(() => filterRange(expenses, range), [expenses, range.start, range.end])
  const incTotal = sum(inc)
  const expTotal = sum(exp)
  const startCapital = useStore((s) => s.startCapital)
  const debtsList = useStore((s) => s.debts)
  const balance = balanceOf({ startCapital, incomes, expenses })
  const bp = moneyParts(balance)
  const debts = useMemo(() => debtsSummary({ debts: debtsList, expenses }), [debtsList, expenses])
  const lp = levelProgress(last7(incomes, now))

  const recent = useMemo(() => {
    const all = [
      ...incomes.map((x) => ({ kind: 'in' as const, x })),
      ...expenses.map((x) => ({ kind: 'out' as const, x })),
    ]
    return all.sort((a, b) => (a.x.date === b.x.date ? b.x.createdAt - a.x.createdAt : a.x.date < b.x.date ? 1 : -1)).slice(0, 8)
  }, [incomes, expenses])

  const activeSources = sources.filter((s) => !s.archived)
  const isEmpty = !sources.length && !incomes.length && !expenses.length

  const startShift = () => {
    if (activeSources.length === 1) {
      useStore.getState().startShift(activeSources[0].id)
      useUI.getState().showToast(`Таймер «${activeSources[0].name}» запущен`)
    } else if (activeSources.length > 1) open({ type: 'pickSource', purpose: 'shift' })
    else open({ type: 'source' })
  }

  return (
    <div className="screen">
      <header className="top">
        <div className="logo">
          <LogoMark />
          Капитал
        </div>
        <div className="top-actions">
          <button className="level-chip" onClick={() => setTab('levels')} aria-label="Мой уровень">
            <LevelBadge level={lp.level} size={30} />
          </button>
          <button className="icon-btn" onClick={() => open({ type: 'settings' })} aria-label="Настройки">
            <Gear size={20} />
          </button>
        </div>
      </header>

      {isEmpty ? (
        <section className="panel welcome">
          <LevelBadge level={lp.level} size={84} glow />
          <h1>Прокачай свой доход</h1>
          <p className="muted">Заводи карты для каждого источника дохода, записывай заработок и время — и поднимайся от «Нищего» до «Бизнесмена».</p>
          <ol className="steps">
            <li>Создай карту: «Доставка», «Такси», «Работа»…</li>
            <li>Записывай доход и сколько часов работал</li>
            <li>Расходы — в отдельный раздел</li>
            <li>Доход за 7 дней определяет твой уровень</li>
          </ol>
          <button className="btn primary wide" onClick={() => open({ type: 'source' })}>
            Создать первую карту
          </button>
          <button className="btn ghost wide" onClick={() => open({ type: 'settings' })}>
            Восстановить из резервной копии
          </button>
        </section>
      ) : (
        <>
          <section className="panel hero">
            <div className="hero-top">
              <span className="hero-label">На счету</span>
              <button className="hero-capital" onClick={() => open({ type: 'capital' })}>
                {startCapital ? `Стартовый капитал ${money(startCapital)}` : '+ Стартовый капитал'}
              </button>
            </div>
            <div className={`hero-amount ${bp.negative ? 'neg' : ''}`}>
              {bp.negative && '−'}
              {bp.int}
              <span>{bp.frac}</span>
              <em>₽</em>
            </div>
            {debts.open.length > 0 && (
              <button className="hero-debt" onClick={() => setTab('expenses')}>
                <HandCoins size={16} />
                <span>
                  Долги <b>−{money(debts.left)}</b>
                </span>
                <span className="muted">· чистыми {money(balance - debts.left)}</span>
              </button>
            )}
            <div className="hero-actions">
              <button onClick={() => open({ type: 'income' })}>
                <ArrowUpRight size={20} />
                Доход
              </button>
              <button onClick={() => open({ type: 'expense' })}>
                <ArrowDownRight size={20} />
                Расход
              </button>
              <button onClick={startShift} disabled={!!shift}>
                <Play size={20} />
                Таймер
              </button>
            </div>
          </section>

          <ShiftBanner />

          <button className="panel level-card" onClick={() => setTab('levels')}>
            <LevelBadge level={lp.level} size={58} />
            <div className="level-card-main">
              <small>Твой уровень · доход за 7 дней</small>
              <b>{lp.level.name}</b>
              <Progress value={lp.ratio} color={`linear-gradient(90deg, ${lp.level.from}, ${lp.next?.from ?? lp.level.to})`} />
              <small className="muted">{lp.next ? `До «${lp.next.name}» — ещё ${money(lp.left)}` : 'Максимальный уровень! 👑'}</small>
            </div>
            <ChevronRight size={20} className="muted" />
          </button>

          <PeriodBar value={period} onChange={setPeriod} label={range.label} />
          <section className="panel">
            <div className="panel-head">
              <h3>Доходы и расходы</h3>
              <small className={`muted ${incTotal - expTotal < 0 ? 'minus-text' : ''}`}>итог {money(incTotal - expTotal, true)}</small>
            </div>
            <div className="hero-pills period-pills">
              <div className="pill plus">
                <ArrowUpRight size={16} />
                <span>
                  <small>Доход · {range.label.toLowerCase()}</small>
                  {money(incTotal)}
                </span>
              </div>
              <div className="pill minus">
                <ArrowDownRight size={16} />
                <span>
                  <small>Расход · {range.label.toLowerCase()}</small>
                  {money(expTotal)}
                </span>
              </div>
            </div>
            <BarChart
              labels={range.buckets.map((b) => b.label)}
              titles={range.buckets.map((b) => bucketTitle(b, period.kind, now, humanDate))}
              current={currentBucket(range.buckets, now)}
              series={[
                { name: 'Доход', color: 'var(--plus)', values: bucketSums(inc, range.buckets), format: (v) => money(v) },
                { name: 'Расход', color: 'var(--minus)', values: bucketSums(exp, range.buckets), format: (v) => money(v) },
              ]}
            />
          </section>

          {activeSources.length > 0 && (
            <section>
              <div className="section-head">
                <h3>Мои карты</h3>
                <button className="link" onClick={() => setTab('cards')}>
                  Все
                </button>
              </div>
              <div className="mini-cards">
                {activeSources.map((s) => {
                  const st = workStats(inc.filter((x) => x.sourceId === s.id))
                  return <IncomeCard key={s.id} source={s} total={st.total} minutes={st.minutes} rate={st.rate} live={shift?.sourceId === s.id} className="mini" onClick={() => open({ type: 'card', sourceId: s.id })} />
                })}
              </div>
            </section>
          )}

          <section className="panel">
            <div className="panel-head">
              <h3>Последние операции</h3>
              {recent.length > 0 && (
                <button className="link" onClick={() => open({ type: 'history' })}>
                  Вся история
                </button>
              )}
            </div>
            {recent.length === 0 && <p className="muted center pad">Здесь появятся твои доходы и расходы</p>}
            {recent.map(({ kind, x }) => {
              if (kind === 'in') {
                const s = sources.find((q) => q.id === x.sourceId)
                const c = cardColor(s?.color ?? '')
                return <OpRow key={x.id} icon={<Icon name={s?.icon ?? 'Coins'} size={18} />} color={c.bg} ink={c.ink} title={s?.name ?? 'Доход'} sub={x.note ? `${humanDate(x.date, now)} · ${x.note}` : humanDate(x.date, now)} minutes={x.minutes} amount={x.amount} onClick={() => open({ type: 'income', edit: x })} />
              }
              const cat = categories.find((q) => q.id === x.categoryId)
              return <OpRow key={x.id} icon={<Icon name={cat?.icon ?? 'Receipt'} size={18} />} color={cat?.color ?? '#64748b'} title={cat?.name ?? 'Расход'} sub={x.note ? `${humanDate(x.date, now)} · ${x.note}` : humanDate(x.date, now)} amount={-x.amount} onClick={() => open({ type: 'expense', edit: x })} />
            })}
          </section>
        </>
      )}
    </div>
  )
}

import { Flame, Plus, Target, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { LevelBadge } from '../components/LevelBadge'
import { Progress } from '../components/Progress'
import { useToday } from '../hooks'
import { GROUPS, TIER_NAMES, achievements } from '../lib/achievements'
import { GOAL_KINDS, goalProgress } from '../lib/goals'
import { compact, money, plural } from '../lib/format'
import { LEVELS, levelFor, levelProgress } from '../lib/levels'
import { bestWeek, last7, streak } from '../lib/stats'
import { useStore } from '../store'
import { useUI } from '../ui'

export function Levels() {
  const data = useStore()
  const open = useUI((s) => s.open)
  const now = useToday()
  const week = last7(data.incomes, now)
  const lp = levelProgress(week)
  const best = bestWeek(data.incomes)
  const bestLevel = Math.max(levelFor(best).index, data.bestLevel, lp.level.index)
  const st = streak(data.incomes, now)
  const ach = achievements(data, now)
  const done = ach.filter((a) => a.done).length
  const [achFilter, setAchFilter] = useState<'all' | 'done' | 'todo'>('all')

  return (
    <div className="screen">
      <header className="top">
        <h1 className="title">Уровни</h1>
      </header>

      <section className="panel level-hero" style={{ ['--glow' as string]: lp.level.from }}>
        <LevelBadge level={lp.level} size={120} glow />
        <small className="muted">
          Уровень {lp.level.index} из {LEVELS.length - 1}
        </small>
        <h2>{lp.level.name}</h2>
        <div className="level-week">
          {money(week)} <small className="muted">за последние 7 дней</small>
        </div>
        <Progress value={lp.ratio} height={10} color={`linear-gradient(90deg, ${lp.level.from}, ${lp.next?.from ?? lp.level.to})`} />
        <div className="level-next">
          {lp.next ? (
            <>
              <span>
                До «{lp.next.name}» — <b>{money(lp.left)}</b>
              </span>
              <LevelBadge level={lp.next} size={28} />
            </>
          ) : (
            <span>Ты на вершине. Бизнесмен! 👑</span>
          )}
        </div>
      </section>

      <div className="tiles">
        <div className="tile">
          <Flame size={18} className="flame" />
          <b>
            {st} {plural(st, ['день', 'дня', 'дней'])}
          </b>
          <small>серия</small>
        </div>
        <div className="tile">
          <Trophy size={18} className="gold" />
          <b>{compact(best)} ₽</b>
          <small>лучшие 7 дней</small>
        </div>
        <div className="tile">
          <Icon name="Medal" size={18} className="violet" />
          <b>
            {done}/{ach.length}
          </b>
          <small>награды</small>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h3>Цели</h3>
          <button className="link" onClick={() => open({ type: 'goal' })}>
            <Plus size={16} /> Цель
          </button>
        </div>
        {data.goals.length === 0 && (
          <button className="goal-empty" onClick={() => open({ type: 'goal' })}>
            <Target size={22} />
            <span>Поставь цель: доход за неделю, за месяц или сумма, которую хочешь накопить</span>
          </button>
        )}
        {data.goals.map((g) => {
          const p = goalProgress(g, data, now)
          const doneGoal = p.ratio >= 1
          return (
            <button key={g.id} className={`goal ${doneGoal ? 'done' : ''}`} onClick={() => open({ type: 'goal', edit: g })}>
              <div className="goal-line">
                <b>{g.title}</b>
                <span>{doneGoal ? '✅' : `${Math.round(p.ratio * 100)}%`}</span>
              </div>
              <Progress value={p.ratio} color={doneGoal ? 'var(--plus)' : undefined} />
              <div className="goal-line muted">
                <small>{GOAL_KINDS.find((k) => k.key === g.kind)?.hint}</small>
                <small>
                  {money(p.value)} из {money(g.target)}
                </small>
              </div>
            </button>
          )
        })}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Лестница уровней</h3>
          <small className="muted">доход за 7 дней</small>
        </div>
        <div className="ladder">
          {[...LEVELS].reverse().map((l) => {
            const current = l.index === lp.level.index
            const locked = l.index > bestLevel
            return (
              <div key={l.index} className={`rung ${current ? 'current' : ''} ${locked ? 'locked' : ''}`}>
                <LevelBadge level={l} size={46} locked={locked} />
                <div className="rung-main">
                  <b>{l.name}</b>
                  <small>{l.min === 0 ? `до ${money(LEVELS[1].min)}` : `от ${money(l.min)}`}</small>
                </div>
                {current && <span className="tag">Ты здесь</span>}
                {!current && !locked && <span className="tag ghost">Открыт</span>}
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Награды</h3>
          <small className="muted">
            {done} из {ach.length}
          </small>
        </div>
        <Progress value={done / ach.length} height={6} color="linear-gradient(90deg, #e7a56b, #fde047, #a5f3fc)" />
        <div className="seg sm ach-filter">
          {(
            [
              ['all', 'Все'],
              ['done', 'Получены'],
              ['todo', 'В процессе'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} className={achFilter === k ? 'on' : ''} onClick={() => setAchFilter(k)}>
              {label}
            </button>
          ))}
        </div>
        {GROUPS.map((group) => {
          const list = ach.filter((a) => a.group === group && (achFilter === 'all' || (achFilter === 'done') === a.done))
          if (!list.length) return null
          return (
            <div key={group} className="ach-group">
              <div className="ach-group-head">
                <span>{group}</span>
                <small className="muted">
                  {ach.filter((a) => a.group === group && a.done).length}/{ach.filter((a) => a.group === group).length}
                </small>
              </div>
              <div className="ach-grid">
                {list.map((a) => {
                  const hidden = a.secret && !a.done
                  return (
                    <div key={a.id} className={`ach tier-${a.tier} ${a.done ? 'done' : ''} ${hidden ? 'secret' : ''}`}>
                      <span className={`ach-icon tier-${a.tier}`}>
                        <Icon name={hidden ? 'Lock' : a.icon} size={22} />
                      </span>
                      <b>{hidden ? 'Секрет' : a.title}</b>
                      <small>{hidden ? 'Откроется сама, когда придёт время' : a.hint}</small>
                      {!a.done && !hidden && a.target > 1 && (
                        <span className="ach-progress">
                          <Progress value={a.value / a.target} height={4} />
                          <small>
                            {achNumber(a.value, a.unit)} / {achNumber(a.target, a.unit)}
                          </small>
                        </span>
                      )}
                      {a.done && <span className="ach-tier">{TIER_NAMES[a.tier]}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}

function achNumber(v: number, unit?: string): string {
  const n = Math.max(0, Math.floor(v))
  if (unit === '₽') return `${compact(n)}`
  return unit ? `${n} ${unit}` : String(n)
}

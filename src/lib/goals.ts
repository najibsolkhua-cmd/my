import type { AppData } from '../store'
import type { Goal, GoalKind } from '../types'
import { periodRange, filterRange, last7, sum } from './stats'
import type { DateStr } from './dates'
import { balanceOf } from './money'

export const GOAL_KINDS: { key: GoalKind; label: string; hint: string }[] = [
  { key: 'week', label: 'Доход за неделю', hint: 'за последние 7 дней' },
  { key: 'month', label: 'Доход за месяц', hint: 'в этом месяце' },
  { key: 'save', label: 'Накопить', hint: 'сколько на счету' },
]

export function goalProgress(g: Goal, d: Pick<AppData, 'incomes' | 'expenses' | 'startCapital'>, now: DateStr) {
  let value: number
  if (g.kind === 'week') value = last7(d.incomes, now)
  else if (g.kind === 'month') value = sum(filterRange(d.incomes, periodRange({ kind: 'month', offset: 0 }, now)))
  else value = balanceOf(d)
  const ratio = g.target > 0 ? Math.max(0, Math.min(1, value / g.target)) : 0
  return { value, ratio }
}

import type { AppData } from '../store'
import { goalProgress } from './goals'
import { levelFor } from './levels'
import { addDays, type DateStr } from './dates'
import { bestWeek, streak, sum, workStats } from './stats'

export type Tier = 'bronze' | 'silver' | 'gold' | 'diamond'

export interface Achievement {
  id: string
  title: string
  hint: string
  icon: string
  tier: Tier
  /** текущий прогресс и цель — для полоски «63 из 100» */
  value: number
  target: number
  unit?: string
  done: boolean
}

export const TIER_NAMES: Record<Tier, string> = { bronze: 'Бронза', silver: 'Серебро', gold: 'Золото', diamond: 'Бриллиант' }

/** Самая длинная серия дней подряд с доходом за всё время. */
export function longestStreak(dates: DateStr[]): number {
  const days = [...new Set(dates)].sort()
  let best = 0
  let run = 0
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && addDays(days[i - 1], 1) === days[i] ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}

/** Сколько прошедших календарных месяцев закрыто в плюс. */
export function plusMonths(d: Pick<AppData, 'incomes' | 'expenses'>, now: DateStr): number {
  const thisMonth = now.slice(0, 7)
  const inc = new Map<string, number>()
  const exp = new Map<string, number>()
  for (const x of d.incomes) inc.set(x.date.slice(0, 7), (inc.get(x.date.slice(0, 7)) ?? 0) + x.amount)
  for (const x of d.expenses) exp.set(x.date.slice(0, 7), (exp.get(x.date.slice(0, 7)) ?? 0) + x.amount)
  let n = 0
  for (const [m, v] of inc) if (m < thisMonth && v > 0 && v > (exp.get(m) ?? 0)) n++
  return n
}

export function achievements(d: AppData, now: DateStr): Achievement[] {
  const total = sum(d.incomes)
  const hours = d.incomes.reduce((s, x) => s + x.minutes, 0) / 60
  const bestStreak = Math.max(longestStreak(d.incomes.map((x) => x.date)), streak(d.incomes, now))
  const daily = new Map<string, number>()
  for (const x of d.incomes) daily.set(x.date, (daily.get(x.date) ?? 0) + x.amount)
  const bestDay = Math.max(0, ...daily.values())
  const bestRate = Math.max(
    0,
    ...d.sources.map((s) => {
      const st = workStats(d.incomes.filter((x) => x.sourceId === s.id))
      return st.minutes >= 300 && st.rate ? st.rate : 0
    }),
  )
  const level = Math.max(d.bestLevel, levelFor(bestWeek(d.incomes)).index)
  const goalsDone = d.goals.filter((g) => goalProgress(g, d, now).ratio >= 1).length
  const balance = total - sum(d.expenses)
  const earned = new Set(d.earned ?? [])

  const list: Omit<Achievement, 'done'>[] = [
    { id: 'card', title: 'Первая карта', hint: 'Создай источник дохода', icon: 'CreditCard', tier: 'bronze', value: d.sources.length, target: 1 },
    { id: 'first', title: 'Первые деньги', hint: 'Запиши первый доход', icon: 'Coins', tier: 'bronze', value: d.incomes.length, target: 1 },
    { id: 'shift1', title: 'Первая смена', hint: 'Засеки смену таймером', icon: 'Timer', tier: 'bronze', value: d.counters.shifts, target: 1 },
    { id: 'streak3', title: 'Разгон', hint: '3 дня подряд с доходом', icon: 'Zap', tier: 'bronze', value: bestStreak, target: 3, unit: 'дн' },
    { id: 'k10', title: 'Первые 10 тысяч', hint: 'Заработай 10 000 ₽', icon: 'Banknote', tier: 'bronze', value: total, target: 10_000, unit: '₽' },
    { id: 'h10', title: 'Разогрев', hint: 'Отработай 10 часов', icon: 'Clock', tier: 'bronze', value: hours, target: 10, unit: 'ч' },
    { id: 'exp20', title: 'Под контролем', hint: 'Запиши 20 расходов', icon: 'Receipt', tier: 'bronze', value: d.expenses.length, target: 20 },
    { id: 'goal1', title: 'Цель взята', hint: 'Достигни любой цели', icon: 'Target', tier: 'bronze', value: goalsDone, target: 1 },
    { id: 'multi3', title: 'Диверсификация', hint: '3 источника дохода', icon: 'Sparkles', tier: 'silver', value: d.sources.length, target: 3 },
    { id: 'streak7', title: 'Неделя огня', hint: '7 дней подряд с доходом', icon: 'Flame', tier: 'silver', value: bestStreak, target: 7, unit: 'дн' },
    { id: 'h100', title: 'Трудяга', hint: 'Отработай 100 часов', icon: 'Hammer', tier: 'silver', value: hours, target: 100, unit: 'ч' },
    { id: 'marathon', title: 'Марафонец', hint: 'Смена 8 часов без остановки', icon: 'Timer', tier: 'silver', value: d.counters.longestShift / 60, target: 8, unit: 'ч' },
    { id: 'k100', title: 'Сотка', hint: 'Заработай 100 000 ₽', icon: 'HandCoins', tier: 'silver', value: total, target: 100_000, unit: '₽' },
    { id: 'day10', title: 'Жирный день', hint: '10 000 ₽ за один день', icon: 'Sun', tier: 'silver', value: bestDay, target: 10_000, unit: '₽' },
    { id: 'rate1000', title: 'Дорогой час', hint: '1 000 ₽/ч на карте (от 5 ч)', icon: 'Gem', tier: 'silver', value: bestRate, target: 1000, unit: '₽' },
    { id: 'lvl3', title: 'Карьерист', hint: 'Дойди до уровня «Менеджер»', icon: 'Briefcase', tier: 'silver', value: level, target: 3 },
    { id: 'plus1', title: 'В плюсе', hint: 'Закрой месяц, заработав больше, чем потратил', icon: 'PiggyBank', tier: 'silver', value: plusMonths(d, now), target: 1 },
    { id: 'multi5', title: 'Империя', hint: '5 источников дохода', icon: 'Building2', tier: 'gold', value: d.sources.length, target: 5 },
    { id: 'streak30', title: 'Железная воля', hint: '30 дней подряд с доходом', icon: 'Shield', tier: 'gold', value: bestStreak, target: 30, unit: 'дн' },
    { id: 'h500', title: 'Стахановец', hint: 'Отработай 500 часов', icon: 'Medal', tier: 'gold', value: hours, target: 500, unit: 'ч' },
    { id: 'k500', title: 'Полмиллиона', hint: 'Заработай 500 000 ₽', icon: 'Landmark', tier: 'gold', value: total, target: 500_000, unit: '₽' },
    { id: 'day30', title: 'Джекпот', hint: '30 000 ₽ за один день', icon: 'Star', tier: 'gold', value: bestDay, target: 30_000, unit: '₽' },
    { id: 'lvl5', title: 'Своё дело', hint: 'Дойди до «Малый предприниматель»', icon: 'Store', tier: 'gold', value: level, target: 5 },
    { id: 'save100', title: 'Подушка', hint: 'Накопи остаток 100 000 ₽', icon: 'Umbrella', tier: 'gold', value: balance, target: 100_000, unit: '₽' },
    { id: 'goal3', title: 'Мечтатель', hint: 'Достигни 3 целей', icon: 'Rocket', tier: 'gold', value: goalsDone, target: 3 },
    { id: 'h1000', title: 'Тысяча часов', hint: 'Отработай 1 000 часов', icon: 'Trophy', tier: 'diamond', value: hours, target: 1000, unit: 'ч' },
    { id: 'm1', title: 'Миллионер', hint: 'Заработай 1 000 000 ₽', icon: 'Crown', tier: 'diamond', value: total, target: 1_000_000, unit: '₽' },
    { id: 'lvl9', title: 'Король', hint: 'Дойди до уровня «Бизнесмен»', icon: 'Crown', tier: 'diamond', value: level, target: 9 },
  ]
  // Однажды полученная награда остаётся навсегда, даже если показатель потом снизился.
  return list.map((a) => ({ ...a, done: earned.has(a.id) || a.value >= a.target }))
}

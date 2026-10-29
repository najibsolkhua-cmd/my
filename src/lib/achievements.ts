import type { AppData } from '../store'
import { goalProgress } from './goals'
import { streak, sum } from './stats'
import type { DateStr } from './dates'

export interface Achievement {
  id: string
  title: string
  hint: string
  icon: string
  done: boolean
}

export function achievements(d: AppData, now: DateStr): Achievement[] {
  const total = sum(d.incomes)
  const minutes = d.incomes.reduce((s, x) => s + x.minutes, 0)
  const st = streak(d.incomes, now)
  const anyGoal = d.goals.some((g) => goalProgress(g, d, now).ratio >= 1)
  return [
    { id: 'card', title: 'Первая карта', hint: 'Создай источник дохода', icon: 'CreditCard', done: d.sources.length > 0 },
    { id: 'first', title: 'Первые деньги', hint: 'Запиши первый доход', icon: 'Coins', done: d.incomes.length > 0 },
    { id: 'multi', title: 'Диверсификация', hint: '3 источника дохода', icon: 'Sparkles', done: d.sources.length >= 3 },
    { id: 'h100', title: '100 часов', hint: 'Отработай 100 часов', icon: 'Hammer', done: minutes >= 6000 },
    { id: 'streak7', title: 'Серия 7 дней', hint: '7 дней подряд с доходом', icon: 'Zap', done: st >= 7 },
    { id: 'k100', title: '100 тысяч', hint: 'Заработай 100 000 ₽', icon: 'Banknote', done: total >= 100_000 },
    { id: 'm1', title: 'Миллионер', hint: 'Заработай 1 000 000 ₽', icon: 'Gem', done: total >= 1_000_000 },
    { id: 'control', title: 'Под контролем', hint: 'Запиши 20 расходов', icon: 'Receipt', done: d.expenses.length >= 20 },
    { id: 'goal', title: 'Цель взята', hint: 'Достигни любой цели', icon: 'Medal', done: anyGoal },
  ]
}

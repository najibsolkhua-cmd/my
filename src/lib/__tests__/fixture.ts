import type { AppData } from '../../store'
import { initialData } from '../../store'
import { addDays, type DateStr } from '../dates'
import type { Expense, Income, Source } from '../../types'

// Детерминированный генератор, чтобы демо выглядело одинаково.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

export function demoData(now: DateStr): AppData {
  const rand = rng(42)
  const base = initialData()
  const t = Date.now()
  const sources: Source[] = [
    { id: 'd-delivery', name: 'Доставка', type: 'side', icon: 'Bike', color: 'sand', pattern: 0, createdAt: t },
    { id: 'd-taxi', name: 'Такси', type: 'side', icon: 'CarTaxiFront', color: 'lemon', pattern: 1, createdAt: t },
    { id: 'd-design', name: 'Дизайн', type: 'project', icon: 'Palette', color: 'periwinkle', pattern: 3, createdAt: t },
    { id: 'd-shop', name: 'Магазин', type: 'business', icon: 'Store', color: 'mint', pattern: 2, createdAt: t },
  ]
  const incomes: Income[] = []
  const expenses: Expense[] = []
  let n = 0
  for (let i = 59; i >= 0; i--) {
    const date = addDays(now, -i)
    const growth = 1 + (59 - i) / 60 // доход постепенно растёт — видно прогресс уровней
    if (rand() < 0.7) {
      const h = 3 + Math.floor(rand() * 6)
      incomes.push({ id: `di${n++}`, sourceId: 'd-delivery', amount: Math.round(h * (380 + rand() * 120) * growth / 10) * 10, minutes: h * 60, date, createdAt: t + n })
    }
    if (rand() < 0.35) {
      const h = 2 + Math.floor(rand() * 5)
      incomes.push({ id: `di${n++}`, sourceId: 'd-taxi', amount: Math.round(h * (520 + rand() * 200) * growth / 10) * 10, minutes: h * 60, date, createdAt: t + n })
    }
    if (rand() < 0.08) {
      const h = 6 + Math.floor(rand() * 14)
      incomes.push({ id: `di${n++}`, sourceId: 'd-design', amount: Math.round((8000 + rand() * 17000) / 100) * 100, minutes: h * 60, date, note: 'Заказ', createdAt: t + n })
    }
    if (i % 7 === 0) {
      incomes.push({ id: `di${n++}`, sourceId: 'd-shop', amount: Math.round((6000 + rand() * 9000) * growth / 100) * 100, minutes: 120 + Math.floor(rand() * 4) * 60, date, createdAt: t + n })
    }
    const spend = (categoryId: string, min: number, max: number, p: number) => {
      if (rand() < p) expenses.push({ id: `de${n++}`, categoryId, amount: Math.round(min + rand() * (max - min)), date, createdAt: t + n })
    }
    spend('c-food', 300, 2500, 0.55)
    spend('c-cafe', 200, 600, 0.3)
    spend('c-rest', 1200, 4500, 0.1)
    spend('c-fuel', 1500, 3000, 0.12)
    spend('c-transport', 60, 300, 0.2)
    spend('c-fun', 500, 3000, 0.06)
    if (date.endsWith('-05')) spend('c-home', 25000, 25000, 1)
    if (date.endsWith('-10')) spend('c-util', 4500, 6500, 1)
    if (date.endsWith('-15')) spend('c-phone', 600, 600, 1)
    if (date.endsWith('-20')) spend('c-subs', 399, 899, 1)
  }
  return {
    ...base,
    sources,
    incomes,
    expenses,
    goals: [
      { id: 'dg1', title: 'Выйти на 40 000 в неделю', kind: 'week', target: 40000, createdAt: t },
      { id: 'dg2', title: 'Подушка безопасности', kind: 'save', target: 150000, createdAt: t },
    ],
  }
}

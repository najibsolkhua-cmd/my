export interface Level {
  index: number
  name: string
  min: number // доход за 7 дней, ₽
  icon: string
  from: string // градиент значка
  to: string
}

export const LEVELS: Level[] = [
  { index: 0, name: 'Нищий', min: 0, icon: 'Soup', from: '#8a8f98', to: '#4b5058' },
  { index: 1, name: 'Работяга', min: 10_000, icon: 'Hammer', from: '#d08a4f', to: '#8a4b22' },
  { index: 2, name: 'Офисный планктон', min: 20_000, icon: 'Paperclip', from: '#6fd3c1', to: '#1f8a78' },
  { index: 3, name: 'Менеджер', min: 30_000, icon: 'Briefcase', from: '#7cb4ff', to: '#2f62d6' },
  { index: 4, name: 'Топ-менеджер', min: 40_000, icon: 'Medal', from: '#a78bfa', to: '#5b33c9' },
  { index: 5, name: 'Малый предприниматель', min: 50_000, icon: 'Store', from: '#f472b6', to: '#b0246f' },
  { index: 6, name: 'Предприниматель', min: 100_000, icon: 'Building2', from: '#fb7185', to: '#c2253b' },
  { index: 7, name: 'Инвестор', min: 250_000, icon: 'TrendingUp', from: '#4ade80', to: '#15803d' },
  { index: 8, name: 'Магнат', min: 500_000, icon: 'Landmark', from: '#e2e8f0', to: '#64748b' },
  { index: 9, name: 'Бизнесмен', min: 1_000_000, icon: 'Crown', from: '#fde047', to: '#d97706' },
]

export function levelFor(weekIncome: number): Level {
  let lvl = LEVELS[0]
  for (const l of LEVELS) if (weekIncome >= l.min) lvl = l
  return lvl
}

export interface LevelProgress {
  level: Level
  next: Level | null
  /** 0..1 — прогресс до следующего уровня */
  ratio: number
  /** сколько не хватает до следующего уровня */
  left: number
}

export function levelProgress(weekIncome: number): LevelProgress {
  const level = levelFor(weekIncome)
  const next = LEVELS[level.index + 1] ?? null
  if (!next) return { level, next, ratio: 1, left: 0 }
  const ratio = (weekIncome - level.min) / (next.min - level.min)
  return { level, next, ratio: Math.max(0, Math.min(1, ratio)), left: Math.max(0, next.min - weekIncome) }
}

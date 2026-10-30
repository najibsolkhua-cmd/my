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
  { index: 1, name: 'Охотник за монетками', min: 5_000, icon: 'Coins', from: '#bef264', to: '#4d7c0f' },
  { index: 2, name: 'Работяга', min: 10_000, icon: 'Hammer', from: '#d08a4f', to: '#8a4b22' },
  { index: 3, name: 'Ударник труда', min: 15_000, icon: 'Zap', from: '#fdba74', to: '#c2410c' },
  { index: 4, name: 'Офисный планктон', min: 20_000, icon: 'Paperclip', from: '#6fd3c1', to: '#1f8a78' },
  { index: 5, name: 'Менеджер', min: 30_000, icon: 'Briefcase', from: '#7cb4ff', to: '#2f62d6' },
  { index: 6, name: 'Мастер дедлайнов', min: 40_000, icon: 'Medal', from: '#a78bfa', to: '#5b33c9' },
  { index: 7, name: 'Стартапер', min: 50_000, icon: 'Store', from: '#f472b6', to: '#b0246f' },
  { index: 8, name: 'Денежный мешок', min: 75_000, icon: 'Banknote', from: '#6ee7b7', to: '#047857' },
  { index: 9, name: 'Предприниматель', min: 100_000, icon: 'Building2', from: '#fb7185', to: '#c2253b' },
  { index: 10, name: 'Инвестор', min: 200_000, icon: 'TrendingUp', from: '#67e8f9', to: '#0e7490' },
  { index: 11, name: 'Волк с Уолл-стрит', min: 300_000, icon: 'Rocket', from: '#a5b4fc', to: '#3730a3' },
  { index: 12, name: 'Магнат', min: 500_000, icon: 'Landmark', from: '#e2e8f0', to: '#64748b' },
  { index: 13, name: 'Титан', min: 750_000, icon: 'Gem', from: '#bae6fd', to: '#0369a1' },
  { index: 14, name: 'Бизнесмен', min: 1_000_000, icon: 'Crown', from: '#fde047', to: '#d97706' },
]

export const MAX_LEVEL = LEVELS.length - 1

/** Номера уровней из старой лестницы (10 ступеней) в новой (15 ступеней). */
export const OLD_TO_NEW_LEVEL = [0, 2, 4, 5, 6, 7, 9, 10, 12, 14]

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

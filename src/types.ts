import type { DateStr } from './lib/dates'

export type SourceType = 'job' | 'side' | 'project' | 'business' | 'invest' | 'other'

/** Источник дохода — «карта». */
export interface Source {
  id: string
  name: string
  type: SourceType
  icon: string
  color: string // ключ палитры
  pattern: number
  createdAt: number
  archived?: boolean
}

export interface Income {
  id: string
  sourceId: string
  amount: number
  date: DateStr
  minutes: number // сколько работал ради этой суммы
  note?: string
  createdAt: number
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string // hex
}

export interface Expense {
  id: string
  categoryId: string
  amount: number
  date: DateStr
  note?: string
  createdAt: number
}

export type GoalKind = 'week' | 'month' | 'save'

export interface Goal {
  id: string
  title: string
  kind: GoalKind
  target: number
  createdAt: number
}

/** Запущенная смена с таймером. */
export interface Shift {
  sourceId: string
  startedAt: number
}

export interface Settings {
  /** главный переключатель уведомлений */
  notifications: boolean
  /** вечернее напоминание записать доход */
  daily: boolean
  /** время напоминания, 'ЧЧ:ММ' */
  dailyTime: string
  /** напоминать, если смена идёт долго */
  shiftAlerts: boolean
  /** итоги недели по понедельникам */
  weekly: boolean
  /** таймер смены на экране блокировки / в Dynamic Island / в шторке */
  liveActivity: boolean
}

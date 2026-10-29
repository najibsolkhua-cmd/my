// Все даты в приложении хранятся как локальные строки 'YYYY-MM-DD',
// чтобы не ловить сдвиги из-за часовых поясов.

export type DateStr = string

const pad = (n: number) => String(n).padStart(2, '0')

export function toDateStr(d: Date): DateStr {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseDate(s: DateStr): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today(): DateStr {
  return toDateStr(new Date())
}

export function addDays(s: DateStr, n: number): DateStr {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

/** Понедельник недели, в которую входит дата. */
export function startOfWeek(s: DateStr): DateStr {
  const d = parseDate(s)
  const dow = (d.getDay() + 6) % 7 // 0 = понедельник
  d.setDate(d.getDate() - dow)
  return toDateStr(d)
}

export function daysInMonth(y: number, m0: number): number {
  return new Date(y, m0 + 1, 0).getDate()
}

export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
export const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
export const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
export const WEEKDAYS_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']

/** «Сегодня», «Вчера» или «12 октября» (+ год, если не текущий). */
export function humanDate(s: DateStr, now: DateStr = today()): string {
  if (s === now) return 'Сегодня'
  if (s === addDays(now, -1)) return 'Вчера'
  const d = parseDate(s)
  const base = `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
  return d.getFullYear() === parseDate(now).getFullYear() ? base : `${base} ${d.getFullYear()}`
}

export function weekdayShort(s: DateStr): string {
  return WEEKDAYS_SHORT[(parseDate(s).getDay() + 6) % 7]
}

import { addDays, daysInMonth, MONTHS, MONTHS_GEN, MONTHS_SHORT, parseDate, startOfWeek, toDateStr, weekdayShort, type DateStr } from './dates'
import { round2 } from './format'

export type PeriodKind = 'week' | 'month' | 'year' | 'all'

export interface Period {
  kind: PeriodKind
  /** 0 — текущий период, -1 — предыдущий и т.д. */
  offset: number
}

export interface Bucket {
  key: string
  label: string
  start: DateStr
  end: DateStr
}

export interface Range {
  /** null — без ограничения */
  start: DateStr | null
  end: DateStr | null
  label: string
  buckets: Bucket[]
}

interface Dated {
  date: DateStr
  amount: number
}

function monthBucket(y: number, m0: number, label?: string): Bucket {
  const start = toDateStr(new Date(y, m0, 1))
  const end = toDateStr(new Date(y, m0, daysInMonth(y, m0)))
  return { key: start.slice(0, 7), label: label ?? MONTHS_SHORT[m0], start, end }
}

export function periodRange(p: Period, now: DateStr, earliest?: DateStr | null): Range {
  const n = parseDate(now)
  switch (p.kind) {
    case 'week': {
      const start = addDays(startOfWeek(now), p.offset * 7)
      const end = addDays(start, 6)
      const buckets: Bucket[] = []
      for (let i = 0; i < 7; i++) {
        const d = addDays(start, i)
        buckets.push({ key: d, label: weekdayShort(d), start: d, end: d })
      }
      const s = parseDate(start)
      const e = parseDate(end)
      const label =
        p.offset === 0
          ? 'Эта неделя'
          : p.offset === -1
            ? 'Прошлая неделя'
            : s.getMonth() === e.getMonth()
              ? `${s.getDate()}–${e.getDate()} ${MONTHS_GEN[e.getMonth()]}`
              : `${s.getDate()} ${MONTHS_SHORT[s.getMonth()]} – ${e.getDate()} ${MONTHS_SHORT[e.getMonth()]}`
      return { start, end, label, buckets }
    }
    case 'month': {
      const d = new Date(n.getFullYear(), n.getMonth() + p.offset, 1)
      const y = d.getFullYear()
      const m = d.getMonth()
      const b = monthBucket(y, m)
      const buckets: Bucket[] = []
      for (let i = 1; i <= daysInMonth(y, m); i++) {
        const ds = toDateStr(new Date(y, m, i))
        buckets.push({ key: ds, label: String(i), start: ds, end: ds })
      }
      const label = y === n.getFullYear() ? MONTHS[m] : `${MONTHS[m]} ${y}`
      return { start: b.start, end: b.end, label, buckets }
    }
    case 'year': {
      const y = n.getFullYear() + p.offset
      const buckets = Array.from({ length: 12 }, (_, m) => monthBucket(y, m))
      return { start: `${y}-01-01`, end: `${y}-12-31`, label: String(y), buckets }
    }
    case 'all': {
      const first = parseDate(earliest && earliest < now ? earliest : now)
      const months = (n.getFullYear() - first.getFullYear()) * 12 + n.getMonth() - first.getMonth() + 1
      const buckets: Bucket[] = []
      if (months <= 12) {
        // минимум 6 столбиков, чтобы график не выглядел пустым
        const count = Math.max(months, 6)
        for (let i = count - 1; i >= 0; i--) {
          const d = new Date(n.getFullYear(), n.getMonth() - i, 1)
          buckets.push(monthBucket(d.getFullYear(), d.getMonth()))
        }
      } else {
        for (let y = first.getFullYear(); y <= n.getFullYear(); y++) {
          buckets.push({ key: String(y), label: String(y), start: `${y}-01-01`, end: `${y}-12-31` })
        }
      }
      return { start: null, end: null, label: 'Всё время', buckets }
    }
  }
}

export function inRange(date: DateStr, r: { start: DateStr | null; end: DateStr | null }): boolean {
  return (r.start === null || date >= r.start) && (r.end === null || date <= r.end)
}

export function sum<T extends { amount: number }>(items: T[]): number {
  return round2(items.reduce((s, x) => s + x.amount, 0))
}

export function filterRange<T extends Dated>(items: T[], r: { start: DateStr | null; end: DateStr | null }): T[] {
  return items.filter((x) => inRange(x.date, r))
}

export function bucketSums<T extends Dated>(items: T[], buckets: Bucket[]): number[] {
  return buckets.map((b) => sum(items.filter((x) => x.date >= b.start && x.date <= b.end)))
}

/** Доход за последние 7 дней, включая сегодня — по нему считается уровень. */
export function last7<T extends Dated>(items: T[], now: DateStr): number {
  return sum(filterRange(items, { start: addDays(now, -6), end: now }))
}

/** Лучший результат за любые 7 дней подряд. */
export function bestWeek<T extends Dated>(items: T[]): number {
  if (!items.length) return 0
  const daily = new Map<DateStr, number>()
  for (const x of items) daily.set(x.date, (daily.get(x.date) ?? 0) + x.amount)
  const days = [...daily.keys()].sort()
  let best = 0
  let windowSum = 0
  let left = 0
  for (let right = 0; right < days.length; right++) {
    windowSum += daily.get(days[right])!
    const minDay = addDays(days[right], -6)
    while (days[left] < minDay) windowSum -= daily.get(days[left++])!
    best = Math.max(best, windowSum)
  }
  return round2(best)
}

/** Сколько дней подряд (до сегодня или вчера) были записи о доходе. */
export function streak<T extends Dated>(items: T[], now: DateStr): number {
  const days = new Set(items.map((x) => x.date))
  let d = days.has(now) ? now : addDays(now, -1)
  let n = 0
  while (days.has(d)) {
    n++
    d = addDays(d, -1)
  }
  return n
}

export interface WorkStats {
  total: number
  minutes: number
  count: number
  /** ₽ в час — считается только по записям, где указано время */
  rate: number | null
}

export function workStats(items: { amount: number; minutes: number }[]): WorkStats {
  let total = 0
  let minutes = 0
  let paidWithTime = 0
  for (const x of items) {
    total += x.amount
    minutes += x.minutes
    if (x.minutes > 0) paidWithTime += x.amount
  }
  return {
    total: round2(total),
    minutes,
    count: items.length,
    rate: minutes > 0 ? round2(paidWithTime / (minutes / 60)) : null,
  }
}

export function earliestDate(...lists: Dated[][]): DateStr | null {
  let min: DateStr | null = null
  for (const list of lists) for (const x of list) if (min === null || x.date < min) min = x.date
  return min
}

/** Группировка по дате (новые сверху) для списков истории. */
export function groupByDate<T extends Dated & { createdAt: number }>(items: T[]): [DateStr, T[]][] {
  const map = new Map<DateStr, T[]>()
  const sorted = [...items].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
  for (const x of sorted) {
    const arr = map.get(x.date)
    if (arr) arr.push(x)
    else map.set(x.date, [x])
  }
  return [...map.entries()]
}

/** Подпись столбика для подсказки: «Вчера», «12 октября», «Март 2026». */
export function bucketTitle(b: Bucket, kind: PeriodKind, now: DateStr, humanDate: (s: DateStr, now: DateStr) => string): string {
  if (b.start === b.end) return humanDate(b.start, now)
  if (b.key.length === 4) return b.key
  const d = parseDate(b.start)
  return kind === 'year' ? MONTHS[d.getMonth()] : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Индекс столбика, в который попадает сегодняшний день. */
export function currentBucket(buckets: Bucket[], now: DateStr): number | undefined {
  const i = buckets.findIndex((b) => now >= b.start && now <= b.end)
  return i < 0 ? undefined : i
}

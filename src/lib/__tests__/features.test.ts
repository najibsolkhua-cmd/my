import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { achievements, longestStreak, plusMonths } from '../achievements'
import { planNotifications, IDS } from '../notifyPlan'
import { DEFAULT_SETTINGS, initialData, type AppData } from '../../store'
import { CARD_COLORS, PATTERN_COUNT, PATTERN_NAMES } from '../../data/palette'
import { demoData } from './fixture'

const base = (patch: Partial<AppData> = {}): AppData => ({ ...initialData(), settings: { ...DEFAULT_SETTINGS, notifications: true }, ...patch })
const income = (date: string, amount: number, minutes = 0) => ({ id: `${date}-${amount}`, sourceId: 's', date, amount, minutes, createdAt: 0 })

describe('уведомления', () => {
  const now = new Date(2026, 9, 29, 12, 0) // чт 29.10.2026, полдень

  it('выключены — ничего не планируем', () => {
    expect(planNotifications(base({ settings: { ...DEFAULT_SETTINGS, notifications: false } }), now)).toEqual([])
  })
  it('вечернее напоминание на 7 дней вперёд', () => {
    const daily = planNotifications(base(), now).filter((n) => n.id < IDS.shift)
    expect(daily).toHaveLength(7)
    expect(daily[0].at).toEqual(new Date(2026, 9, 29, 21, 0))
  })
  it('сегодня уже записал — сегодня не напоминаем', () => {
    const daily = planNotifications(base({ incomes: [income('2026-10-29', 1000)] }), now).filter((n) => n.id < IDS.shift)
    expect(daily).toHaveLength(6)
    expect(daily[0].at).toEqual(new Date(2026, 9, 30, 21, 0))
  })
  it('время прошло — сегодняшнее пропускаем', () => {
    const late = new Date(2026, 9, 29, 22, 0)
    expect(planNotifications(base(), late).filter((n) => n.id < IDS.shift)[0].at).toEqual(new Date(2026, 9, 30, 21, 0))
  })
  it('серия упоминается в напоминании', () => {
    const d = base({ incomes: [income('2026-10-28', 1), income('2026-10-27', 1), income('2026-10-26', 1)] })
    expect(planNotifications(d, now)[0].title).toContain('Серия 3 дня')
  })
  it('долгая смена: 4, 8, 12 часов', () => {
    const startedAt = new Date(2026, 9, 29, 7, 0).getTime() // уже 5 часов
    const d = base({ shift: { sourceId: 's', startedAt }, sources: [{ id: 's', name: 'Доставка', type: 'side', icon: 'Bike', color: 'sand', pattern: 0, createdAt: 0 }] })
    const shift = planNotifications(d, now).filter((n) => n.id >= IDS.shift && n.id < IDS.weekly)
    expect(shift.map((n) => n.at.getHours())).toEqual([15, 19])
    expect(shift[0].title).toBe('Смена «Доставка» идёт уже 8 ч')
  })
  it('итоги недели — ближайший понедельник 10:00', () => {
    const w = planNotifications(base({ incomes: [income('2026-10-27', 25000)] }), now).find((n) => n.id === IDS.weekly)!
    expect(w.at).toEqual(new Date(2026, 10, 2, 10, 0))
    expect(w.body).toContain('Офисный планктон')
  })
})

describe('награды', () => {
  it('самая длинная серия', () => {
    expect(longestStreak(['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-05', '2026-01-02'])).toBe(3)
    expect(longestStreak([])).toBe(0)
  })
  it('месяцы в плюсе считаются только завершённые', () => {
    const d = { incomes: [income('2026-09-10', 1000), income('2026-10-01', 5000)], expenses: [{ id: 'e', categoryId: 'c', amount: 500, date: '2026-09-11', createdAt: 0 }] }
    expect(plusMonths(d, '2026-10-29')).toBe(1)
  })
  it('полученная награда не пропадает', () => {
    const d = base({ earned: ['k100'] })
    expect(achievements(d, '2026-10-29').find((a) => a.id === 'k100')!.done).toBe(true)
  })
  it('прогресс по часам', () => {
    const a = achievements(base({ incomes: [income('2026-10-29', 100, 600)] }), '2026-10-29')
    expect(a.find((x) => x.id === 'h10')!.done).toBe(true)
    expect(a.find((x) => x.id === 'h100')!.value).toBe(10)
  })
  it('у всех наград разные id', () => {
    const ids = achievements(base(), '2026-10-29').map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBeGreaterThanOrEqual(25)
  })
})

describe('оформление', () => {
  it('цвета уникальны, старые ключи на месте', () => {
    const keys = CARD_COLORS.map((c) => c.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const k of ['sand', 'lemon', 'mint', 'periwinkle', 'sky', 'teal', 'tomato', 'orange', 'pink', 'violet', 'graphite', 'navy']) expect(keys).toContain(k)
    for (const c of CARD_COLORS) expect(c.base).toMatch(/^#[0-9A-F]{6}$/i)
  })
  it('у каждого узора есть название', () => {
    expect(PATTERN_NAMES).toHaveLength(PATTERN_COUNT)
    expect(PATTERN_COUNT).toBeGreaterThanOrEqual(18)
  })
})

// Для скриншотов: DEMO_OUT=путь npx vitest run пишет пример данных в файл.
it('пример данных для скриншотов', () => {
  const out = process.env.DEMO_OUT
  if (out) writeFileSync(out, JSON.stringify({ state: { ...demoData('2026-10-29'), settings: DEFAULT_SETTINGS, earned: null, counters: { shifts: 0, longestShift: 0 } }, version: 2 }))
})

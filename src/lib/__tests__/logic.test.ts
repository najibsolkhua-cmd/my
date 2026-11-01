import { describe, expect, it } from 'vitest'
import { addDays, startOfWeek } from '../dates'
import { compact, duration, formatAmountInput, money, parseAmount, plural } from '../format'
import { LEVELS, levelFor, levelProgress } from '../levels'
import { bestWeek, bucketSums, groupByDate, last7, periodRange, streak, workStats } from '../stats'
import { goalProgress } from '../goals'
import { validateBackup } from '../../store'
import { demoData } from './fixture'

const inc = (date: string, amount: number, minutes = 0, createdAt = 0) => ({ date, amount, minutes, createdAt })

describe('уровни', () => {
  it('пороги из задания', () => {
    expect(levelFor(0).name).toBe('Нищий')
    expect(levelFor(4_999).name).toBe('Нищий')
    expect(levelFor(5_000).name).toBe('Охотник за монетками')
    expect(levelFor(10_000).name).toBe('Работяга')
    expect(levelFor(15_000).name).toBe('Ударник труда')
    expect(levelFor(20_000).name).toBe('Офисный планктон')
    expect(levelFor(30_000).name).toBe('Менеджер')
    expect(levelFor(40_000).name).toBe('Мастер дедлайнов')
    expect(levelFor(50_000).name).toBe('Стартапер')
    expect(levelFor(75_000).name).toBe('Денежный мешок')
    expect(levelFor(300_000).name).toBe('Волк с Уолл-стрит')
    expect(levelFor(750_000).name).toBe('Титан')
    expect(levelFor(1_000_000).name).toBe('Бизнесмен')
    expect(LEVELS).toHaveLength(15)
    LEVELS.forEach((l, i) => expect(l.index).toBe(i))
    expect(levelFor(50_000_000).name).toBe('Бизнесмен')
  })
  it('пороги растут', () => {
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].min).toBeGreaterThan(LEVELS[i - 1].min)
  })
  it('прогресс до следующего уровня', () => {
    const p = levelProgress(12_500)
    expect(p.level.name).toBe('Работяга')
    expect(p.next?.name).toBe('Ударник труда')
    expect(p.ratio).toBeCloseTo(0.5)
    expect(p.left).toBe(2_500)
    expect(levelProgress(2_000_000).next).toBeNull()
  })
})

describe('даты и периоды', () => {
  it('неделя начинается с понедельника', () => {
    expect(startOfWeek('2026-10-29')).toBe('2026-10-26') // четверг → понедельник
    expect(startOfWeek('2026-11-01')).toBe('2026-10-26') // воскресенье
    expect(startOfWeek('2026-10-26')).toBe('2026-10-26')
  })
  it('переход через месяц и год', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29')
  })
  it('месяц: дни и навигация назад', () => {
    const r = periodRange({ kind: 'month', offset: 0 }, '2026-02-10')
    expect(r.start).toBe('2026-02-01')
    expect(r.end).toBe('2026-02-28')
    expect(r.buckets).toHaveLength(28)
    const prev = periodRange({ kind: 'month', offset: -2 }, '2026-01-15')
    expect(prev.start).toBe('2025-11-01')
    expect(prev.label).toBe('Ноябрь 2025')
  })
  it('неделя: 7 столбиков', () => {
    const r = periodRange({ kind: 'week', offset: -1 }, '2026-10-29')
    expect(r.start).toBe('2026-10-19')
    expect(r.end).toBe('2026-10-25')
    expect(r.buckets.map((b) => b.label)).toEqual(['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'])
  })
  it('всё время: по месяцам или по годам', () => {
    expect(periodRange({ kind: 'all', offset: 0 }, '2026-10-29', '2026-08-01').buckets).toHaveLength(6)
    const years = periodRange({ kind: 'all', offset: 0 }, '2026-10-29', '2023-05-01').buckets
    expect(years.map((b) => b.key)).toEqual(['2023', '2024', '2025', '2026'])
  })
})

describe('статистика', () => {
  const items = [inc('2026-10-29', 1000, 120), inc('2026-10-23', 500, 0), inc('2026-10-22', 700, 60), inc('2026-10-28', 300.1, 30)]
  it('доход за 7 дней включает сегодня и 6 дней назад', () => {
    expect(last7(items, '2026-10-29')).toBe(1800.1)
  })
  it('₽/час только по записям со временем', () => {
    const s = workStats(items)
    expect(s.total).toBe(2500.1)
    expect(s.minutes).toBe(210)
    expect(s.rate).toBeCloseTo((1000 + 700 + 300.1) / 3.5)
    expect(workStats([inc('2026-01-01', 100)]).rate).toBeNull()
  })
  it('лучшие 7 дней подряд', () => {
    expect(bestWeek([inc('2026-01-01', 100), inc('2026-01-07', 100), inc('2026-01-08', 100)])).toBe(200)
    expect(bestWeek([])).toBe(0)
  })
  it('серия дней', () => {
    const s = [inc('2026-10-29', 1), inc('2026-10-28', 1), inc('2026-10-27', 1), inc('2026-10-25', 1)]
    expect(streak(s, '2026-10-29')).toBe(3)
    expect(streak(s, '2026-10-30')).toBe(3) // сегодня ещё не записал — серия не сгорает
    expect(streak(s, '2026-10-31')).toBe(0)
  })
  it('суммы по столбикам', () => {
    const r = periodRange({ kind: 'week', offset: 0 }, '2026-10-29')
    expect(bucketSums(items, r.buckets)).toEqual([0, 0, 300.1, 1000, 0, 0, 0])
  })
  it('нет ошибок округления', () => {
    expect(workStats([inc('2026-01-01', 0.1), inc('2026-01-01', 0.2)]).total).toBe(0.3)
  })
  it('группировка по дате — новые сверху', () => {
    const g = groupByDate([inc('2026-01-01', 1, 0, 1), inc('2026-01-02', 2, 0, 2), inc('2026-01-01', 3, 0, 3)])
    expect(g.map(([d]) => d)).toEqual(['2026-01-02', '2026-01-01'])
    expect(g[1][1].map((x) => x.amount)).toEqual([3, 1])
  })
})

describe('форматирование и ввод', () => {
  it('деньги', () => {
    expect(money(1234567.4)).toBe('1 234 567 ₽')
    expect(money(-500)).toBe('−500 ₽')
    expect(money(500, true)).toBe('+500 ₽')
    expect(compact(186_486)).toBe('186k')
    expect(compact(1_500_000)).toBe('1,5M')
  })
  it('разбор суммы', () => {
    expect(parseAmount('12 500,50')).toBe(12500.5)
    expect(parseAmount('0,1')).toBe(0.1)
    expect(parseAmount('')).toBeNaN()
    expect(parseAmount('abc')).toBeNaN()
    expect(parseAmount('1.2.3')).toBeNaN()
  })
  it('маска ввода', () => {
    expect(formatAmountInput('12500')).toBe('12 500')
    expect(formatAmountInput('12500.567')).toBe('12 500,56')
    expect(formatAmountInput('1,2,3')).toBe('1,23')
    expect(formatAmountInput('007')).toBe('7')
    expect(formatAmountInput(',5')).toBe('0,5')
    expect(formatAmountInput('1a2b')).toBe('12')
  })
  it('время и склонения', () => {
    expect(duration(330)).toBe('5 ч 30 мин')
    expect(duration(45)).toBe('45 мин')
    expect(duration(120)).toBe('2 ч')
    expect(plural(1, ['день', 'дня', 'дней'])).toBe('день')
    expect(plural(3, ['день', 'дня', 'дней'])).toBe('дня')
    expect(plural(11, ['день', 'дня', 'дней'])).toBe('дней')
    expect(plural(21, ['день', 'дня', 'дней'])).toBe('день')
  })
})

describe('цели и резервные копии', () => {
  it('цель «накопить» считает остаток', () => {
    const g = { id: 'g', title: '', kind: 'save' as const, target: 1000, createdAt: 0 }
    const d = { startCapital: 0, incomes: [{ ...inc('2026-10-01', 1500), id: 'a', sourceId: 's' }], expenses: [{ id: 'e', categoryId: 'c', amount: 1000, date: '2026-10-02', createdAt: 0 }] }
    const p = goalProgress(g, d, '2026-10-29')
    expect(p.value).toBe(500)
    expect(p.ratio).toBe(0.5)
    // стартовый капитал входит в «На счету»
    expect(goalProgress(g, { ...d, startCapital: 250 }, '2026-10-29').value).toBe(750)
  })
  it('демо-данные проходят проверку копии', () => {
    const d = demoData('2026-10-29')
    const res = validateBackup({ data: d })
    expect(typeof res).toBe('object')
    expect(validateBackup(JSON.parse(JSON.stringify(d)))).not.toBeTypeOf('string')
  })
  it('битая копия отклоняется', () => {
    expect(validateBackup(null)).toBeTypeOf('string')
    expect(validateBackup({ sources: [] })).toBeTypeOf('string')
    expect(validateBackup({ sources: [], incomes: [{ id: 1 }], expenses: [], categories: [] })).toBeTypeOf('string')
  })
})

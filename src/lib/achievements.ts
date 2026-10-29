import type { AppData } from '../store'
import { goalProgress } from './goals'
import { levelFor } from './levels'
import { addDays, parseDate, startOfWeek, type DateStr } from './dates'
import { bestWeek, streak, sum, workStats } from './stats'

export type Tier = 'bronze' | 'silver' | 'gold' | 'diamond'

export interface Achievement {
  id: string
  title: string
  hint: string
  icon: string
  tier: Tier
  group: string
  /** секретная — условие скрыто, пока не получена */
  secret?: boolean
  /** текущий прогресс и цель — для полоски «63 из 100» */
  value: number
  target: number
  unit?: string
  done: boolean
}

export const TIER_NAMES: Record<Tier, string> = { bronze: 'Бронза', silver: 'Серебро', gold: 'Золото', diamond: 'Бриллиант' }

export const GROUPS = ['Старт', 'Деньги', 'Цена часа', 'Время', 'Смены', 'Серии', 'Источники', 'Уровни', 'Расходы и цели', 'Секретные']

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
  const { inc, exp } = monthSums(d)
  let n = 0
  for (const [m, v] of inc) if (m < now.slice(0, 7) && v > 0 && v > (exp.get(m) ?? 0)) n++
  return n
}

function monthSums(d: Pick<AppData, 'incomes' | 'expenses'>) {
  const inc = new Map<string, number>()
  const exp = new Map<string, number>()
  const expCount = new Map<string, number>()
  for (const x of d.incomes) inc.set(x.date.slice(0, 7), (inc.get(x.date.slice(0, 7)) ?? 0) + x.amount)
  for (const x of d.expenses) {
    const m = x.date.slice(0, 7)
    exp.set(m, (exp.get(m) ?? 0) + x.amount)
    expCount.set(m, (expCount.get(m) ?? 0) + 1)
  }
  return { inc, exp, expCount }
}

/** Самая длинная цепочка недель подряд, где каждая лучше предыдущей. */
export function growthRun(d: Pick<AppData, 'incomes'>): number {
  const weeks = new Map<string, number>()
  for (const x of d.incomes) {
    const w = startOfWeek(x.date)
    weeks.set(w, (weeks.get(w) ?? 0) + x.amount)
  }
  const keys = [...weeks.keys()].sort()
  let best = 1
  let run = 1
  for (let i = 1; i < keys.length; i++) {
    const consecutive = addDays(keys[i - 1], 7) === keys[i]
    run = consecutive && weeks.get(keys[i])! > weeks.get(keys[i - 1])! ? run + 1 : 1
    best = Math.max(best, run)
  }
  return keys.length ? best : 0
}

export function achievements(d: AppData, now: DateStr): Achievement[] {
  const total = sum(d.incomes)
  const hours = d.incomes.reduce((s, x) => s + x.minutes, 0) / 60
  const days = [...new Set(d.incomes.map((x) => x.date))].sort()
  const bestStreak = Math.max(longestStreak(days), streak(d.incomes, now))
  const daily = new Map<string, number>()
  for (const x of d.incomes) daily.set(x.date, (daily.get(x.date) ?? 0) + x.amount)
  const bestDay = Math.max(0, ...daily.values())
  const bestEntry = Math.max(0, ...d.incomes.map((x) => x.amount))
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
  const { inc: monthInc, exp: monthExp, expCount } = monthSums(d)
  const bestMonth = Math.max(0, ...monthInc.values())
  const thisMonth = now.slice(0, 7)
  const thrifty = [...monthInc].some(([m, v]) => m < thisMonth && v > 0 && (expCount.get(m) ?? 0) >= 5 && (monthExp.get(m) ?? 0) < v / 2)
  const weekendDays = days.filter((x) => [0, 6].includes(parseDate(x).getDay())).length
  const comeback = days.some((x, i) => i > 0 && addDays(days[i - 1], 8) <= x)
  const weekSources = new Map<string, Set<string>>()
  for (const x of d.incomes) {
    const w = startOfWeek(x.date)
    if (!weekSources.has(w)) weekSources.set(w, new Set())
    weekSources.get(w)!.add(x.sourceId)
  }
  const maxWeekSources = Math.max(0, ...[...weekSources.values()].map((s) => s.size))
  const growth = growthRun(d)
  const expenseCats = new Set(d.expenses.map((x) => x.categoryId)).size
  const ownCats = d.categories.filter((c) => !c.id.startsWith('c-')).length
  const yes = (v: boolean) => (v ? 1 : 0)
  const earned = new Set(d.earned ?? [])

  type Def = Omit<Achievement, 'done' | 'group'>
  const groups: [string, Def[]][] = [
    [
      'Старт',
      [
        { id: 'card', title: 'Первая карта', hint: 'Создай источник дохода', icon: 'CreditCard', tier: 'bronze', value: d.sources.length, target: 1 },
        { id: 'first', title: 'Первые деньги', hint: 'Запиши первый доход', icon: 'Coins', tier: 'bronze', value: d.incomes.length, target: 1 },
        { id: 'exp1', title: 'Всё под учётом', hint: 'Запиши первый расход', icon: 'Receipt', tier: 'bronze', value: d.expenses.length, target: 1 },
        { id: 'goalNew', title: 'Мечтать не вредно', hint: 'Поставь первую цель', icon: 'Flag', tier: 'bronze', value: d.goals.length, target: 1 },
        { id: 'catNew', title: 'Творец', hint: 'Создай свою категорию расходов', icon: 'Palette', tier: 'bronze', value: ownCats, target: 1 },
      ],
    ],
    [
      'Деньги',
      [
        { id: 'k10', title: 'Первые 10 тысяч', hint: 'Заработай 10 000 ₽', icon: 'Banknote', tier: 'bronze', value: total, target: 10_000, unit: '₽' },
        { id: 'k100', title: 'Сотка', hint: 'Заработай 100 000 ₽', icon: 'HandCoins', tier: 'silver', value: total, target: 100_000, unit: '₽' },
        { id: 'k500', title: 'Полмиллиона', hint: 'Заработай 500 000 ₽', icon: 'Landmark', tier: 'gold', value: total, target: 500_000, unit: '₽' },
        { id: 'm1', title: 'Миллионер', hint: 'Заработай 1 000 000 ₽', icon: 'Crown', tier: 'diamond', value: total, target: 1_000_000, unit: '₽' },
        { id: 'day10', title: 'Жирный день', hint: '10 000 ₽ за один день', icon: 'Sun', tier: 'silver', value: bestDay, target: 10_000, unit: '₽' },
        { id: 'day30', title: 'Джекпот', hint: '30 000 ₽ за один день', icon: 'Star', tier: 'gold', value: bestDay, target: 30_000, unit: '₽' },
        { id: 'big50', title: 'Крупная рыба', hint: 'Одна запись дохода от 50 000 ₽', icon: 'Fish', tier: 'gold', value: bestEntry, target: 50_000, unit: '₽' },
        { id: 'big100', title: 'Кит', hint: 'Одна запись дохода от 100 000 ₽', icon: 'Ship', tier: 'diamond', value: bestEntry, target: 100_000, unit: '₽' },
        { id: 'month100', title: 'Сотня за месяц', hint: '100 000 ₽ за календарный месяц', icon: 'CalendarCheck', tier: 'silver', value: bestMonth, target: 100_000, unit: '₽' },
        { id: 'month300', title: 'Урожайный месяц', hint: '300 000 ₽ за календарный месяц', icon: 'Clover', tier: 'gold', value: bestMonth, target: 300_000, unit: '₽' },
      ],
    ],
    [
      'Цена часа',
      [
        { id: 'rate500', title: 'Пятисотка', hint: '500 ₽/ч на карте (от 5 ч)', icon: 'Gauge', tier: 'bronze', value: bestRate, target: 500, unit: '₽' },
        { id: 'rate1000', title: 'Дорогой час', hint: '1 000 ₽/ч на карте (от 5 ч)', icon: 'Gem', tier: 'silver', value: bestRate, target: 1000, unit: '₽' },
        { id: 'rate2000', title: 'Час — золото', hint: '2 000 ₽/ч на карте (от 5 ч)', icon: 'Hourglass', tier: 'gold', value: bestRate, target: 2000, unit: '₽' },
        { id: 'rate5000', title: 'Консультант', hint: '5 000 ₽/ч на карте (от 5 ч)', icon: 'Lightbulb', tier: 'diamond', value: bestRate, target: 5000, unit: '₽' },
      ],
    ],
    [
      'Время',
      [
        { id: 'h10', title: 'Разогрев', hint: 'Отработай 10 часов', icon: 'Clock', tier: 'bronze', value: hours, target: 10, unit: 'ч' },
        { id: 'h50', title: 'Втянулся', hint: 'Отработай 50 часов', icon: 'Activity', tier: 'bronze', value: hours, target: 50, unit: 'ч' },
        { id: 'h100', title: 'Трудяга', hint: 'Отработай 100 часов', icon: 'Hammer', tier: 'silver', value: hours, target: 100, unit: 'ч' },
        { id: 'h250', title: 'Четверть тысячи', hint: 'Отработай 250 часов', icon: 'Footprints', tier: 'silver', value: hours, target: 250, unit: 'ч' },
        { id: 'h500', title: 'Стахановец', hint: 'Отработай 500 часов', icon: 'Medal', tier: 'gold', value: hours, target: 500, unit: 'ч' },
        { id: 'h1000', title: 'Тысяча часов', hint: 'Отработай 1 000 часов', icon: 'Trophy', tier: 'diamond', value: hours, target: 1000, unit: 'ч' },
      ],
    ],
    [
      'Смены',
      [
        { id: 'shift1', title: 'Первая смена', hint: 'Засеки смену таймером', icon: 'Timer', tier: 'bronze', value: d.counters.shifts, target: 1 },
        { id: 'shift10', title: 'Сменщик', hint: 'Отработай 10 смен с таймером', icon: 'Repeat', tier: 'bronze', value: d.counters.shifts, target: 10 },
        { id: 'shift50', title: 'Вахтовик', hint: 'Отработай 50 смен с таймером', icon: 'Anchor', tier: 'gold', value: d.counters.shifts, target: 50 },
        { id: 'marathon', title: 'Марафонец', hint: 'Смена 8 часов без остановки', icon: 'Timer', tier: 'silver', value: d.counters.longestShift / 60, target: 8, unit: 'ч' },
        { id: 'iron12', title: 'Железный человек', hint: 'Смена 12 часов без остановки', icon: 'Shield', tier: 'gold', value: d.counters.longestShift / 60, target: 12, unit: 'ч' },
        { id: 'night', title: 'Ночная сова', hint: 'Начни смену ночью (22:00–05:00)', icon: 'Moon', tier: 'silver', value: d.counters.nightShifts, target: 1 },
        { id: 'early', title: 'Ранняя пташка', hint: 'Начни смену до 7 утра', icon: 'Sunrise', tier: 'silver', value: d.counters.earlyShifts, target: 1 },
      ],
    ],
    [
      'Серии',
      [
        { id: 'streak3', title: 'Разгон', hint: '3 дня подряд с доходом', icon: 'Zap', tier: 'bronze', value: bestStreak, target: 3, unit: 'дн' },
        { id: 'streak7', title: 'Неделя огня', hint: '7 дней подряд с доходом', icon: 'Flame', tier: 'silver', value: bestStreak, target: 7, unit: 'дн' },
        { id: 'streak14', title: 'Две недели в огне', hint: '14 дней подряд с доходом', icon: 'Flame', tier: 'gold', value: bestStreak, target: 14, unit: 'дн' },
        { id: 'streak30', title: 'Железная воля', hint: '30 дней подряд с доходом', icon: 'Shield', tier: 'gold', value: bestStreak, target: 30, unit: 'дн' },
        { id: 'streak100', title: 'Легенда', hint: '100 дней подряд с доходом', icon: 'Infinity', tier: 'diamond', value: bestStreak, target: 100, unit: 'дн' },
        { id: 'days50', title: 'Полсотни', hint: '50 дней с доходом', icon: 'CalendarCheck', tier: 'silver', value: days.length, target: 50, unit: 'дн' },
        { id: 'days100', title: 'Сто рабочих дней', hint: '100 дней с доходом', icon: 'Mountain', tier: 'gold', value: days.length, target: 100, unit: 'дн' },
        { id: 'days365', title: 'Год в строю', hint: '365 дней с доходом', icon: 'MountainSnow', tier: 'diamond', value: days.length, target: 365, unit: 'дн' },
        { id: 'weekend10', title: 'Без выходных', hint: '10 выходных дней с доходом', icon: 'Coffee', tier: 'silver', value: weekendDays, target: 10, unit: 'дн' },
        { id: 'comeback', title: 'Камбэк', hint: 'Вернись к заработку после недели перерыва', icon: 'Bird', tier: 'bronze', value: yes(comeback), target: 1 },
      ],
    ],
    [
      'Источники',
      [
        { id: 'multi3', title: 'Диверсификация', hint: '3 источника дохода', icon: 'Sparkles', tier: 'silver', value: d.sources.length, target: 3 },
        { id: 'multi5', title: 'Империя', hint: '5 источников дохода', icon: 'Building2', tier: 'gold', value: d.sources.length, target: 5 },
        { id: 'juggler', title: 'Многостаночник', hint: 'Доход из 3 источников за одну неделю', icon: 'Layers', tier: 'silver', value: maxWeekSources, target: 3 },
      ],
    ],
    [
      'Уровни',
      [
        { id: 'lvl2', title: 'Золотые руки', hint: 'Дойди до уровня «Работяга»', icon: 'Hammer', tier: 'bronze', value: level, target: 2 },
        { id: 'lvl3', title: 'Карьерист', hint: 'Дойди до уровня «Менеджер»', icon: 'Briefcase', tier: 'silver', value: level, target: 5 },
        { id: 'lvl5', title: 'Своё дело', hint: 'Дойди до «Малый предприниматель»', icon: 'Store', tier: 'gold', value: level, target: 7 },
        { id: 'lvl8', title: 'Тугой кошелёк', hint: 'Дойди до «Денежный мешок»', icon: 'Banknote', tier: 'gold', value: level, target: 8 },
        { id: 'lvl11', title: 'Акула', hint: 'Дойди до «Волк с Уолл-стрит»', icon: 'Swords', tier: 'diamond', value: level, target: 11 },
        { id: 'lvl13', title: 'Нырок в золото', hint: 'Дойди до «Скрудж Макдак»', icon: 'Waves', tier: 'diamond', value: level, target: 13 },
        { id: 'lvl9', title: 'Король', hint: 'Дойди до уровня «Бизнесмен»', icon: 'Crown', tier: 'diamond', value: level, target: 14 },
        { id: 'growth', title: 'На взлёт', hint: 'Неделя лучше предыдущей', icon: 'TrendingUp', tier: 'bronze', value: growth, target: 2, unit: 'нед' },
        { id: 'rocket', title: 'Ракета', hint: '4 недели подряд каждая лучше прошлой', icon: 'Rocket', tier: 'gold', value: growth, target: 4, unit: 'нед' },
      ],
    ],
    [
      'Расходы и цели',
      [
        { id: 'exp20', title: 'Под контролем', hint: 'Запиши 20 расходов', icon: 'Receipt', tier: 'bronze', value: d.expenses.length, target: 20 },
        { id: 'exp100', title: 'Бухгалтер', hint: 'Запиши 100 расходов', icon: 'Calculator', tier: 'silver', value: d.expenses.length, target: 100 },
        { id: 'cats10', title: 'Широкая душа', hint: 'Расходы в 10 разных категориях', icon: 'Shapes', tier: 'silver', value: expenseCats, target: 10 },
        { id: 'plus1', title: 'В плюсе', hint: 'Закрой месяц, заработав больше, чем потратил', icon: 'PiggyBank', tier: 'silver', value: plusMonths(d, now), target: 1 },
        { id: 'plus3', title: 'Стабильность', hint: '3 месяца в плюсе', icon: 'ChartLine', tier: 'gold', value: plusMonths(d, now), target: 3, unit: 'мес' },
        { id: 'thrifty', title: 'Экономист', hint: 'Месяц, где расходы меньше половины дохода', icon: 'BadgePercent', tier: 'gold', value: yes(thrifty), target: 1 },
        { id: 'save100', title: 'Подушка', hint: 'Накопи остаток 100 000 ₽', icon: 'Umbrella', tier: 'gold', value: balance, target: 100_000, unit: '₽' },
        { id: 'save500', title: 'Кубышка', hint: 'Накопи остаток 500 000 ₽', icon: 'Wallet', tier: 'diamond', value: balance, target: 500_000, unit: '₽' },
        { id: 'goal1', title: 'Цель взята', hint: 'Достигни любой цели', icon: 'Target', tier: 'bronze', value: goalsDone, target: 1 },
        { id: 'goal3', title: 'Мечтатель', hint: 'Достигни 3 целей', icon: 'Rocket', tier: 'gold', value: goalsDone, target: 3 },
      ],
    ],
    [
      'Секретные',
      [
        { id: 'fri13', title: 'Пятница, 13-е', hint: 'Заработай в пятницу 13-го', icon: 'Dices', tier: 'gold', secret: true, value: yes(d.incomes.some((x) => x.date.endsWith('-13') && parseDate(x.date).getDay() === 5)), target: 1 },
        { id: 'newyear', title: 'Новогодний', hint: 'Заработай 31 декабря или 1 января', icon: 'Snowflake', tier: 'gold', secret: true, value: yes(d.incomes.some((x) => /-(12-31|01-01)$/.test(x.date))), target: 1 },
        { id: 'lucky', title: 'Счастливчик', hint: 'Сумма дохода с цифрами 777', icon: 'Clover', tier: 'silver', secret: true, value: yes(d.incomes.some((x) => String(x.amount).includes('777'))), target: 1 },
        { id: 'midnight', title: 'Полуночник', hint: 'Запиши доход между полуночью и 5 утра', icon: 'Moon', tier: 'silver', secret: true, value: yes(d.incomes.some((x) => x.createdAt > 0 && new Date(x.createdAt).getHours() < 5)), target: 1 },
      ],
    ],
  ]
  // Однажды полученная награда остаётся навсегда, даже если показатель потом снизился.
  return groups.flatMap(([group, list]) => list.map((a) => ({ ...a, group, done: earned.has(a.id) || a.value >= a.target })))
}

import type { AppData } from '../store'
import { addDays, startOfWeek, toDateStr } from './dates'
import { money, plural } from './format'
import { levelFor } from './levels'
import { filterRange, streak, sum } from './stats'

export interface PlannedNotification {
  id: number
  title: string
  body: string
  at: Date
}

// Диапазоны id, которыми управляет приложение.
export const IDS = { daily: 1000, shift: 2000, weekly: 3000, ongoing: 4000 }
export const MANAGED = (id: number) => id >= 1000 && id < 4000

const DAILY_TEXTS = [
  'Как прошёл день? Запиши доход — уровень сам себя не прокачает 💪',
  'Пара секунд: внеси сегодняшний заработок в «Капитал»',
  'Не забудь записать доходы и расходы за сегодня',
  'Сколько сегодня заработал? Запиши, пока помнишь',
]

const at = (date: string, time: string) => {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0)
}

/** Какие уведомления должны стоять в расписании прямо сейчас. */
export function planNotifications(d: AppData, now: Date): PlannedNotification[] {
  const s = d.settings
  if (!s.notifications) return []
  const out: PlannedNotification[] = []
  const today = toDateStr(now)

  if (s.daily) {
    const st = streak(d.incomes, today)
    const recordedToday = d.incomes.some((x) => x.date === today)
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i)
      const when = at(date, s.dailyTime)
      if (when <= now) continue
      if (i === 0 && recordedToday) continue // сегодня уже записал — не дёргаем
      // Серия на завтра известна, только если сегодня уже есть запись.
      const runningStreak = i === 0 ? st : i === 1 && recordedToday ? st : 0
      out.push({
        id: IDS.daily + i,
        title: runningStreak >= 2 ? `🔥 Серия ${runningStreak} ${plural(runningStreak, ['день', 'дня', 'дней'])}` : 'Капитал',
        body: runningStreak >= 2 ? 'Не дай серии сгореть — запиши сегодняшний доход' : DAILY_TEXTS[(now.getDate() + i) % DAILY_TEXTS.length],
        at: when,
      })
    }
  }

  if (s.shiftAlerts && d.shift) {
    const name = d.sources.find((x) => x.id === d.shift!.sourceId)?.name ?? 'Смена'
    ;[4, 8, 12].forEach((h, i) => {
      const when = new Date(d.shift!.startedAt + h * 3600_000)
      if (when > now)
        out.push({ id: IDS.shift + i, title: `Смена «${name}» идёт уже ${h} ч`, body: 'Не забудь завершить её в приложении, чтобы время записалось', at: when })
    })
  }

  if (s.weekly) {
    const monday = addDays(startOfWeek(today), 7)
    const range = { start: addDays(monday, -7), end: addDays(monday, -1) }
    const inc = sum(filterRange(d.incomes, range))
    const exp = sum(filterRange(d.expenses, range))
    out.push({
      id: IDS.weekly,
      title: 'Итоги недели',
      body: inc || exp ? `Доход ${money(inc)}, расход ${money(exp)}. Уровень: ${levelFor(inc).name}` : 'Новая неделя — новый шанс поднять уровень. Запиши первый доход!',
      at: at(monday, '10:00'),
    })
  }
  return out
}

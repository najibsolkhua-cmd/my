import { useEffect, useState } from 'react'
import { today } from './lib/dates'

/** Текущее время, обновляется с заданным интервалом. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

/** Сегодняшняя дата; меняется в полночь, даже если приложение открыто. */
export function useToday(): string {
  useNow(30_000)
  return today()
}

/** «01:23:45» для таймера работы. */
export function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':')
}

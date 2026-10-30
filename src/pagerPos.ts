import { useEffect, useState } from 'react'

// Позиция перелистывания вкладок: 0 — «Главная», 3 — «Уровни», дробные значения — во время свайпа.
// Двигаем напрямую ленту страниц и линзу в панели — без пересчёта стилей всего приложения,
// и не чаще одного раза за кадр.
export const TABS_COUNT = 4
let pos = 0
let frame = 0
const listeners = new Set<(p: number) => void>()
const targets = { track: null as HTMLElement | null, lens: null as HTMLElement | null }

function apply() {
  frame = 0
  if (targets.track) targets.track.style.transform = `translate3d(${(-pos * 100) / TABS_COUNT}%, 0, 0)`
  if (targets.lens) targets.lens.style.translate = `${pos * 100}% 0`
  listeners.forEach((l) => l(pos))
}

/** immediate — применить сразу (смена вкладки), иначе — в ближайшем кадре (во время свайпа). */
export function setPos(p: number, immediate = false) {
  pos = p
  if (immediate) {
    if (frame) cancelAnimationFrame(frame)
    apply()
  } else if (!frame) frame = requestAnimationFrame(apply)
}

export function getPos() {
  return pos
}

export function bindTrack(el: HTMLElement | null) {
  targets.track = el
  if (el) apply()
}

export function bindLens(el: HTMLElement | null) {
  targets.lens = el
  if (el) apply()
}

/** Доводка до вкладки с длительностью по скорости броска (как в Telegram). */
export function animateTo(p: number, durationMs = 420) {
  for (const el of [targets.track, targets.lens]) if (el) el.style.transitionDuration = `${Math.round(durationMs)}ms`
  setPos(p, true)
}

/** Пока палец ведёт — без анимации, страница точно под пальцем. */
export function setDragging(on: boolean) {
  document.documentElement.classList.toggle('dragging', on)
}

/** Ближайшая вкладка к текущей позиции — для подсветки иконки под линзой. */
export function usePosIndex(): number {
  const clamp = (p: number) => Math.round(Math.max(0, Math.min(TABS_COUNT - 1, p)))
  const [i, setI] = useState(() => clamp(pos))
  useEffect(() => {
    const l = (p: number) => setI(clamp(p))
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return i
}

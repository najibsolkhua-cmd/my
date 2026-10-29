import { useEffect, useState } from 'react'

// Позиция перелистывания вкладок: 0 — «Главная», 3 — «Уровни», дробные значения — во время свайпа.
// Хранится в CSS-переменной --pos: по ней едут и страницы, и «линза» в нижней панели.
export const TABS_COUNT = 4
let pos = 0
const listeners = new Set<(p: number) => void>()

export function setPos(p: number) {
  pos = p
  document.documentElement.style.setProperty('--pos', p.toFixed(4))
  listeners.forEach((l) => l(p))
}

export function getPos() {
  return pos
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

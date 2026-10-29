import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { setDragging, setPos, TABS_COUNT } from '../pagerPos'
import { Cards } from '../screens/Cards'
import { Expenses } from '../screens/Expenses'
import { Home } from '../screens/Home'
import { Levels } from '../screens/Levels'
import { TABS, useUI, type Tab } from '../ui'

const SCREENS: Record<Tab, () => React.JSX.Element> = { home: Home, cards: Cards, expenses: Expenses, levels: Levels }
const PULL_MAX = 120
const PULL_TRIGGER = 72

/**
 * Вкладки лежат лентой: их можно листать свайпом влево-вправо.
 * На любой вкладке, если потянуть вниз от самого верха, — обновление.
 */
export function Pager() {
  const tab = useUI((s) => s.tab)
  const index = TABS.indexOf(tab)
  const indexRef = useRef(index)
  const rootRef = useRef<HTMLDivElement>(null)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const refreshingRef = useRef(false)

  useLayoutEffect(() => {
    indexRef.current = index
    setPos(index)
  }, [index])

  useEffect(() => {
    const root = rootRef.current!
    type Gesture = { x: number; y: number; t: number; mode: 'none' | 'h' | 'v' | 'pull'; page: HTMLElement | null; noswipe: boolean; atTop: boolean; dx: number; dy: number }
    let g: Gesture | null = null
    const width = () => root.clientWidth || window.innerWidth

    const content = (page: HTMLElement | null) => page?.firstElementChild as HTMLElement | null

    const onStart = (e: TouchEvent) => {
      if (e.touches.length > 1 || refreshingRef.current || useUI.getState().layers.length) {
        g = null
        return
      }
      const t = e.touches[0]
      const target = e.target as Element
      const page = target.closest<HTMLElement>('.page')
      g = { x: t.clientX, y: t.clientY, t: performance.now(), mode: 'none', page, noswipe: !!target.closest('[data-noswipe], input, textarea, select'), atTop: (page?.scrollTop ?? 1) <= 0, dx: 0, dy: 0 }
    }

    const onMove = (e: TouchEvent) => {
      if (!g) return
      const t = e.touches[0]
      g.dx = t.clientX - g.x
      g.dy = t.clientY - g.y
      if (g.mode === 'none') {
        if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) return
        if (Math.abs(g.dx) > Math.abs(g.dy) * 1.2 && !g.noswipe) {
          g.mode = 'h'
          setDragging(true)
        } else if (g.dy > 0 && g.atTop && (g.page?.scrollTop ?? 1) <= 0) g.mode = 'pull'
        else g.mode = 'v'
      }
      if (g.mode === 'h') {
        e.preventDefault()
        let p = indexRef.current - g.dx / width()
        if (p < 0) p *= 0.3 // упругий край у первой и последней вкладки
        if (p > TABS_COUNT - 1) p = TABS_COUNT - 1 + (p - TABS_COUNT + 1) * 0.3
        setPos(p)
      } else if (g.mode === 'pull') {
        e.preventDefault()
        const d = Math.min(PULL_MAX, Math.max(0, g.dy) * 0.5)
        const c = content(g.page)
        if (c) {
          c.style.transition = 'none'
          c.style.transform = `translate3d(0, ${d}px, 0)`
        }
        setPull(d)
      }
    }

    const onEnd = () => {
      if (!g) return
      const dt = Math.max(1, performance.now() - g.t)
      if (g.mode === 'h') {
        setDragging(false)
        const v = g.dx / dt // пикселей в мс
        let next = indexRef.current
        if (g.dx < -width() * 0.2 || v < -0.35) next++
        if (g.dx > width() * 0.2 || v > 0.35) next--
        next = Math.max(0, Math.min(TABS_COUNT - 1, next))
        if (next !== indexRef.current) useUI.getState().setTab(TABS[next])
        else setPos(indexRef.current)
      } else if (g.mode === 'pull') {
        const c = content(g.page)
        const d = Math.min(PULL_MAX, Math.max(0, g.dy) * 0.5)
        if (c) c.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
        if (d >= PULL_TRIGGER) {
          refreshingRef.current = true
          setRefreshing(true)
          setPull(56)
          if (c) c.style.transform = 'translate3d(0, 56px, 0)'
          // Перезагрузка подтягивает свежую версию приложения; данные хранятся отдельно и не теряются.
          setTimeout(() => location.reload(), 750)
        } else {
          setPull(0)
          if (c) c.style.transform = ''
        }
      }
      g = null
    }

    root.addEventListener('touchstart', onStart, { passive: true })
    root.addEventListener('touchmove', onMove, { passive: false })
    root.addEventListener('touchend', onEnd)
    root.addEventListener('touchcancel', onEnd)
    return () => {
      root.removeEventListener('touchstart', onStart)
      root.removeEventListener('touchmove', onMove)
      root.removeEventListener('touchend', onEnd)
      root.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  const progress = Math.min(1, pull / PULL_TRIGGER)
  return (
    <div className="pager" ref={rootRef}>
      <div className={`ptr ${refreshing ? 'spin' : ''}`} style={{ opacity: Math.min(1, pull / 36), transform: `translate3d(-50%, ${Math.min(pull, 64) - 52}px, 0) rotate(${progress * 270}deg)` }} aria-hidden={!refreshing}>
        <svg viewBox="0 0 36 36" width="36" height="36">
          <circle cx="18" cy="18" r="13" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeDasharray={`${(refreshing ? 0.7 : progress * 0.85) * 81.7} 81.7`} />
        </svg>
      </div>
      <div className="track">
        {TABS.map((t, i) => {
          const Screen = SCREENS[t]
          return (
            <div key={t} className="page" aria-hidden={i !== index} inert={i !== index ? true : undefined}>
              <Screen />
            </div>
          )
        })}
      </div>
    </div>
  )
}

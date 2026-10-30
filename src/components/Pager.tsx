import { memo, useEffect, useLayoutEffect, useRef } from 'react'
import { animateTo, bindTrack, getPos, setDragging, setPos, TABS_COUNT } from '../pagerPos'
import { isIOS } from '../platform'
import { Cards } from '../screens/Cards'
import { Expenses } from '../screens/Expenses'
import { Home } from '../screens/Home'
import { Levels } from '../screens/Levels'
import { activeLayers, TABS, useUI, type Tab } from '../ui'

// memo: при смене вкладки экраны не перерисовываются заново — анимация не дёргается.
const SCREENS: Record<Tab, React.MemoExoticComponent<() => React.JSX.Element>> = { home: memo(Home), cards: memo(Cards), expenses: memo(Expenses), levels: memo(Levels) }
const PULL_MAX = 120
const PULL_TRIGGER = 72

/**
 * Вкладки лежат лентой и листаются свайпом. Вертикальную прокрутку полностью ведёт
 * система (как в нативных приложениях) — JavaScript её не тормозит: горизонталь
 * ловим указательными событиями (touch-action: pan-y), «потяни, чтобы обновить»
 * на iPhone — через родную «пружинку» iOS.
 */
export function Pager() {
  const tab = useUI((s) => s.tab)
  const index = TABS.indexOf(tab)
  const indexRef = useRef(index)
  const rootRef = useRef<HTMLDivElement>(null)
  const ptrRef = useRef<HTMLDivElement>(null)
  const refreshing = useRef(false)

  useLayoutEffect(() => {
    // смена вкладки нажатием — плавная доводка; после свайпа доводку уже запустил жест
    if (indexRef.current !== index) animateTo(index)
    else setPos(index, true)
    indexRef.current = index
  }, [index])

  // ---------- свайп между вкладками ----------
  useEffect(() => {
    const root = rootRef.current!
    type G = { id: number; x: number; y: number; mode: 'none' | 'h' | 'v'; noswipe: boolean; samples: { x: number; t: number }[] }
    let g: G | null = null
    const width = () => root.clientWidth || window.innerWidth

    const down = (e: PointerEvent) => {
      if (g || (e.pointerType === 'mouse' && e.button !== 0) || refreshing.current || activeLayers(useUI.getState()).length) return
      const target = e.target as Element
      g = { id: e.pointerId, x: e.clientX, y: e.clientY, mode: 'none', noswipe: !!target.closest('[data-noswipe], input, textarea, select'), samples: [{ x: e.clientX, t: e.timeStamp }] }
    }
    const move = (e: PointerEvent) => {
      if (!g || e.pointerId !== g.id) return
      const dx = e.clientX - g.x
      const dy = e.clientY - g.y
      if (g.mode === 'none') {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (Math.abs(dx) > Math.abs(dy) * 1.2 && !g.noswipe) {
          g.mode = 'h'
          root.setPointerCapture?.(e.pointerId)
          setDragging(true)
        } else {
          g = null // вертикаль — это прокрутка, её ведёт система
          return
        }
      }
      g.samples.push({ x: e.clientX, t: e.timeStamp })
      if (g.samples.length > 5) g.samples.shift()
      let p = indexRef.current - dx / width()
      if (p < 0) p *= 0.3 // упругий край у первой и последней вкладки
      if (p > TABS_COUNT - 1) p = TABS_COUNT - 1 + (p - TABS_COUNT + 1) * 0.3
      setPos(p)
    }
    const up = (e: PointerEvent) => {
      if (!g || e.pointerId !== g.id) return
      const cur = g
      g = null
      if (cur.mode !== 'h') return
      setDragging(false)
      const s = cur.samples
      const v = s.length > 1 ? (s[s.length - 1].x - s[0].x) / Math.max(1, s[s.length - 1].t - s[0].t) : 0 // px/мс
      const dx = (s[s.length - 1]?.x ?? cur.x) - cur.x
      let next = indexRef.current
      if (dx < -width() * 0.5 || v < -0.3) next++
      if (dx > width() * 0.5 || v > 0.3) next--
      next = Math.max(0, Math.min(TABS_COUNT - 1, next))
      // длительность доводки — по скорости пальца: быстрый бросок — быстрая доводка
      const dist = Math.abs(next - getPos()) * width()
      const dur = Math.abs(v) > 0.3 ? Math.min(420, Math.max(180, (dist / Math.abs(v)) * 1.6)) : 380
      animateTo(next, dur)
      if (next !== indexRef.current) {
        indexRef.current = next
        useUI.getState().setTab(TABS[next])
      }
    }
    root.addEventListener('pointerdown', down, { passive: true })
    root.addEventListener('pointermove', move, { passive: true })
    root.addEventListener('pointerup', up, { passive: true })
    root.addEventListener('pointercancel', up, { passive: true })
    return () => {
      root.removeEventListener('pointerdown', down)
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerup', up)
      root.removeEventListener('pointercancel', up)
    }
  }, [])

  // ---------- «потяни, чтобы обновить» ----------
  useEffect(() => {
    const root = rootRef.current!
    const ptr = ptrRef.current!
    const show = (d: number, spin = false) => {
      const progress = Math.min(1, d / PULL_TRIGGER)
      ptr.style.opacity = String(Math.min(1, d / 36))
      ptr.style.transform = `translate3d(-50%, ${Math.min(d, 64) - 52}px, 0) rotate(${progress * 270}deg)`
      ptr.classList.toggle('spin', spin)
      const arc = ptr.querySelector('circle')!
      arc.setAttribute('stroke-dasharray', `${(spin ? 0.7 : progress * 0.85) * 81.7} 81.7`)
    }
    const refresh = () => {
      refreshing.current = true
      show(56, true)
      // перезагрузка подтягивает свежую версию приложения; данные хранятся отдельно
      setTimeout(() => location.reload(), 650)
    }

    if (isIOS) {
      // iOS сама делает «пружинку»: при оттягивании сверху scrollTop становится отрицательным.
      // Только читаем его — прокрутку не трогаем, поэтому она остаётся родной и плавной.
      let pulled = 0
      let touching = false
      const onScroll = (e: Event) => {
        if (refreshing.current) return
        const top = (e.target as HTMLElement).scrollTop
        pulled = top < 0 ? -top : 0
        if (touching || pulled) show(pulled * 1.1)
      }
      const onStart = () => (touching = true)
      const onEnd = () => {
        touching = false
        if (refreshing.current) return
        if (pulled * 1.1 >= PULL_TRIGGER) refresh()
        else show(0)
      }
      root.addEventListener('scroll', onScroll, { passive: true, capture: true })
      root.addEventListener('touchstart', onStart, { passive: true })
      root.addEventListener('touchend', onEnd, { passive: true })
      return () => {
        root.removeEventListener('scroll', onScroll, { capture: true })
        root.removeEventListener('touchstart', onStart)
        root.removeEventListener('touchend', onEnd)
      }
    }

    // Android/компьютер: «пружинки» нет — тянем сами, если начали в самом верху экрана.
    // Обработчики пассивные: прокрутке там просто нечего делать, мешать ей не нужно.
    let g: { y: number; page: HTMLElement; d: number; active: boolean } | null = null
    const content = () => g?.page.firstElementChild as HTMLElement | null
    const onStart = (e: TouchEvent) => {
      const page = (e.target as Element).closest<HTMLElement>('.page')
      g = page && page.scrollTop <= 0 && !refreshing.current && !activeLayers(useUI.getState()).length ? { y: e.touches[0].clientY, page, d: 0, active: false } : null
    }
    const onMove = (e: TouchEvent) => {
      if (!g) return
      const dy = e.touches[0].clientY - g.y
      if (!g.active && (dy < 8 || g.page.scrollTop > 0)) {
        if (dy < -8 || g.page.scrollTop > 0) g = null
        return
      }
      g.active = true
      g.d = Math.min(PULL_MAX, dy * 0.5)
      const c = content()
      if (c) {
        c.style.transition = 'none'
        c.style.transform = `translate3d(0, ${g.d}px, 0)`
      }
      show(g.d)
    }
    const onEnd = () => {
      if (!g?.active) return void (g = null)
      const c = content()
      if (c) {
        c.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
        c.style.transform = g.d >= PULL_TRIGGER ? 'translate3d(0, 56px, 0)' : ''
      }
      if (g.d >= PULL_TRIGGER) refresh()
      else show(0)
      g = null
    }
    root.addEventListener('touchstart', onStart, { passive: true })
    root.addEventListener('touchmove', onMove, { passive: true })
    root.addEventListener('touchend', onEnd, { passive: true })
    root.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      root.removeEventListener('touchstart', onStart)
      root.removeEventListener('touchmove', onMove)
      root.removeEventListener('touchend', onEnd)
      root.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  return (
    <div className="pager" ref={rootRef}>
      <div className="ptr" ref={ptrRef} style={{ opacity: 0 }} aria-hidden>
        <svg viewBox="0 0 36 36" width="36" height="36">
          <circle cx="18" cy="18" r="13" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeDasharray="0 81.7" />
        </svg>
      </div>
      <div className="track" ref={bindTrack}>
        {TABS.map((t, i) => {
          const Screen = SCREENS[t]
          return (
            <div key={t} className="page" aria-hidden={i !== index}>
              <Screen />
            </div>
          )
        })}
      </div>
    </div>
  )
}

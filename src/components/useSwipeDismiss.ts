import { useEffect, type RefObject } from 'react'

interface Options {
  /** 'x' — свайп вправо (экран), 'y' — свайп вниз (шторка) */
  axis: 'x' | 'y'
  onDismiss: () => void
  /** для шторки: прокручиваемая часть — тянуть вниз можно, только если она в самом верху */
  scrollSelector?: string
}

/** Закрытие жестом: экран уезжает вслед за пальцем, отпустил дальше трети — закрылся. */
export function useSwipeDismiss(ref: RefObject<HTMLElement | null>, { axis, onDismiss, scrollSelector }: Options) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let g: { x: number; y: number; t: number; mode: 'none' | 'drag' | 'skip'; d: number } | null = null
    const size = () => (axis === 'x' ? el.clientWidth : el.clientHeight) || 1
    const set = (d: number, animate: boolean) => {
      el.style.transition = animate ? 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
      el.style.transform = d ? (axis === 'x' ? `translate3d(${d}px,0,0)` : `translate3d(0,${d}px,0)`) : ''
    }

    const onStart = (e: TouchEvent) => {
      const target = e.target as Element
      if (e.touches.length > 1 || target.closest('[data-noswipe], input, textarea, select')) return void (g = null)
      if (axis === 'y' && scrollSelector) {
        const sc = target.closest<HTMLElement>(scrollSelector)
        if (sc && sc.scrollTop > 0) return void (g = null)
      }
      const t = e.touches[0]
      g = { x: t.clientX, y: t.clientY, t: performance.now(), mode: 'none', d: 0 }
    }
    const onMove = (e: TouchEvent) => {
      if (!g || g.mode === 'skip') return
      const t = e.touches[0]
      const dx = t.clientX - g.x
      const dy = t.clientY - g.y
      const main = axis === 'x' ? dx : dy
      const cross = axis === 'x' ? dy : dx
      if (g.mode === 'none') {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        g.mode = main > 0 && Math.abs(main) > Math.abs(cross) * 1.2 ? 'drag' : 'skip'
        if (g.mode === 'skip') return
      }
      e.preventDefault()
      g.d = Math.max(0, main)
      set(g.d, false)
    }
    const onEnd = () => {
      if (!g || g.mode !== 'drag') return void (g = null)
      const v = g.d / Math.max(1, performance.now() - g.t)
      if (g.d > size() * 0.3 || v > 0.5) {
        set(size(), true)
        setTimeout(onDismiss, 220)
      } else set(0, true)
      g = null
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [ref, axis, onDismiss, scrollSelector])
}

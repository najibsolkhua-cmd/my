import { useEffect, type RefObject } from 'react'

interface Options {
  /** 'x' — свайп вправо (экран), 'y' — свайп вниз (шторка) */
  axis: 'x' | 'y'
  onDismiss: () => void
  /** откуда можно тянуть (для шторки — ручка и заголовок) */
  handleSelector?: string
}

const PARALLAX = 22 // на сколько процентов главный экран уезжает влево под открытым экраном

/**
 * Закрытие жестом, как в Telegram: экран едет за пальцем, главный экран выезжает
 * из-под него; отпустил дальше трети или быстрым броском — закрылся.
 * Указательные события пассивные — прокрутку они не тормозят.
 */
export function useSwipeDismiss(ref: RefObject<HTMLElement | null>, { axis, onDismiss, handleSelector }: Options) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let g: { id: number; x: number; y: number; mode: 'none' | 'drag'; d: number; samples: { v: number; t: number }[] } | null = null
    const size = () => (axis === 'x' ? el.clientWidth : el.clientHeight) || 1
    const main = () => (axis === 'x' ? document.querySelector<HTMLElement>('main') : null)
    const ease = 'cubic-bezier(0.32, 0.72, 0, 1)'

    const set = (d: number, ms: number) => {
      el.style.transition = ms ? `transform ${ms}ms ${ease}` : 'none'
      el.style.transform = d ? (axis === 'x' ? `translate3d(${d}px,0,0)` : `translate3d(0,${d}px,0)`) : ''
      const m = main()
      if (m) {
        const p = Math.min(1, d / size())
        m.style.transition = ms ? `transform ${ms}ms ${ease}, opacity ${ms}ms ${ease}` : 'none'
        m.style.transform = `translate3d(${-PARALLAX * (1 - p)}%,0,0)`
        m.style.opacity = String(0.55 + 0.45 * p)
      }
    }
    const clearMain = () => {
      const m = main()
      if (m) m.style.transition = m.style.transform = m.style.opacity = ''
    }

    const down = (e: PointerEvent) => {
      if (g || (e.pointerType === 'mouse' && e.button !== 0)) return
      const target = e.target as Element
      if (target.closest('[data-noswipe], input, textarea, select')) return
      if (handleSelector && !target.closest(handleSelector)) return
      g = { id: e.pointerId, x: e.clientX, y: e.clientY, mode: 'none', d: 0, samples: [] }
    }
    const move = (e: PointerEvent) => {
      if (!g || e.pointerId !== g.id) return
      const dx = e.clientX - g.x
      const dy = e.clientY - g.y
      const along = axis === 'x' ? dx : dy
      const across = axis === 'x' ? dy : dx
      if (g.mode === 'none') {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (along > 0 && Math.abs(along) > Math.abs(across) * 1.2) {
          g.mode = 'drag'
          el.setPointerCapture?.(e.pointerId)
        } else {
          g = null
          return
        }
      }
      g.d = Math.max(0, along)
      g.samples.push({ v: g.d, t: e.timeStamp })
      if (g.samples.length > 5) g.samples.shift()
      set(g.d, 0)
    }
    const up = (e: PointerEvent) => {
      if (!g || e.pointerId !== g.id) return
      const cur = g
      g = null
      if (cur.mode !== 'drag') return
      const s = cur.samples
      const v = s.length > 1 ? (s[s.length - 1].v - s[0].v) / Math.max(1, s[s.length - 1].t - s[0].t) : 0
      if (cur.d > size() * 0.33 || v > 0.45) {
        const ms = Math.min(300, Math.max(160, (size() - cur.d) / Math.max(v, 1)))
        set(size(), ms)
        setTimeout(() => {
          onDismiss()
          // убираем ручной сдвиг, когда главный экран уже перестал быть «позади» — без рывка
          setTimeout(clearMain, 80)
        }, ms)
      } else {
        set(0, 300)
        setTimeout(clearMain, 300)
      }
    }
    el.addEventListener('pointerdown', down, { passive: true })
    el.addEventListener('pointermove', move, { passive: true })
    el.addEventListener('pointerup', up, { passive: true })
    el.addEventListener('pointercancel', up, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [ref, axis, onDismiss, handleSelector])
}

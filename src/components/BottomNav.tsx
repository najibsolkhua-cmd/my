import { Home, Layers, Plus, Trophy, Wallet } from 'lucide-react'
import { useRef, useState } from 'react'
import { bindLens, getPos, setDragging, setPos, TABS_COUNT, usePosIndex } from '../pagerPos'
import { TABS, useUI } from '../ui'

const ITEMS = [
  { label: 'Главная', icon: Home },
  { label: 'Карты', icon: Layers },
  { label: 'Расходы', icon: Wallet },
  { label: 'Уровни', icon: Trophy },
]
const PAD = 4

/** Стеклянная панель как в Telegram: линзу можно перетаскивать пальцем. */
export function BottomNav() {
  const navRef = useRef<HTMLDivElement>(null)
  const [pressing, setPressing] = useState(false)
  const drag = useRef<{ x: number; moved: boolean } | null>(null)
  const hot = usePosIndex()

  const posAt = (clientX: number) => {
    const r = navRef.current!.getBoundingClientRect()
    const w = (r.width - PAD * 2) / TABS_COUNT
    return Math.max(0, Math.min(TABS_COUNT - 1, (clientX - r.left - PAD - w / 2) / w))
  }

  const reset = () => {
    drag.current = null
    setPressing(false)
    setDragging(false)
    setPos(TABS.indexOf(useUI.getState().tab))
  }

  const select = (i: number) => {
    const ui = useUI.getState()
    if (TABS[i] === ui.tab) {
      setPos(i)
      // повторное нажатие на вкладку — прокрутить её наверх
      document.querySelectorAll<HTMLElement>('.page')[i]?.scrollTo({ top: 0, behavior: 'smooth' })
    } else ui.setTab(TABS[i])
  }

  return (
    <div className="nav-wrap">
      <nav
        ref={navRef}
        className={`nav glass ${pressing ? 'pressing' : ''}`}
        role="tablist"
        onPointerDown={(e) => {
          navRef.current!.setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, moved: false }
          setPressing(true)
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          if (!d.moved && Math.abs(e.clientX - d.x) > 6) {
            d.moved = true
            setDragging(true)
          }
          if (d.moved) setPos(posAt(e.clientX))
        }}
        onPointerUp={(e) => {
          const d = drag.current
          drag.current = null
          navRef.current?.releasePointerCapture?.(e.pointerId)
          setPressing(false)
          setDragging(false)
          if (!d) return
          select(Math.round(d.moved ? getPos() : posAt(e.clientX)))
        }}
        onPointerCancel={reset}
        onLostPointerCapture={() => drag.current && reset()}
      >
        <span className="nav-lens" ref={bindLens} aria-hidden />
        {ITEMS.map((it, i) => (
          <button
            key={it.label}
            role="tab"
            aria-selected={hot === i}
            className={`nav-item ${hot === i ? 'on' : ''}`}
            onClick={(e) => e.detail === 0 && select(i)} // клавиатура; касания обрабатывает панель
          >
            <it.icon size={24} strokeWidth={hot === i ? 2.3 : 1.9} />
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
      <button className="nav-plus glass" onClick={() => useUI.getState().open({ type: 'add' })} aria-label="Добавить">
        <Plus size={28} strokeWidth={2.4} />
      </button>
    </div>
  )
}

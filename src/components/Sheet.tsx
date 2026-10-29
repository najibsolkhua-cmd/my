import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useUI } from '../ui'

/** Шторка снизу. Закрывается крестиком, тапом по фону, Esc и кнопкой «назад». */
export function Sheet({ title, children, footer }: { title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const close = useUI((s) => s.close)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])
  return (
    <div className="sheet-wrap">
      <div className="sheet-backdrop" onClick={close} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={close} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { money, duration } from '../lib/format'

/** Строка операции в списках истории. */
export function OpRow({ icon, color, ink, title, sub, amount, minutes, onClick }: { icon: ReactNode; color: string; ink?: string; title: string; sub?: string; amount: number; minutes?: number; onClick?: () => void }) {
  return (
    <button className="op" onClick={onClick}>
      <span className="op-icon" style={{ background: color, color: ink ?? '#fff' }}>
        {icon}
      </span>
      <span className="op-main">
        <b>{title}</b>
        {(sub || minutes) && <small>{[minutes ? duration(minutes) : '', sub].filter(Boolean).join(' · ')}</small>}
      </span>
      <span className={`op-amount ${amount >= 0 ? 'plus' : 'minus'}`}>{money(amount, true)}</span>
    </button>
  )
}

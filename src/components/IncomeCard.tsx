import type { CSSProperties } from 'react'
import { cardColor } from '../data/palette'
import { sourceTypeLabel } from '../data/defaults'
import { hoursShort, money, moneyParts } from '../lib/format'
import type { Source } from '../types'
import { CardPattern } from './CardPattern'
import { Icon } from './Icon'

interface Props {
  source: Pick<Source, 'name' | 'type' | 'icon' | 'color' | 'pattern'>
  total: number
  minutes: number
  rate: number | null
  live?: boolean
  className?: string
  onClick?: () => void
  style?: CSSProperties
}

export function IncomeCard({ source, total, minutes, rate, live, className = '', onClick, style }: Props) {
  const c = cardColor(source.color)
  const p = moneyParts(total)
  return (
    <div
      className={`ccard ${className}`}
      style={{ background: c.bg, color: c.ink, ...style }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
    >
      <CardPattern pattern={source.pattern} color={c.accent} bg={c.base} />
      <div className="ccard-top">
        <div className="ccard-name">
          <b>{source.name || 'Без названия'}</b>
          <span>{sourceTypeLabel(source.type)}</span>
        </div>
        <div className="ccard-icon">
          {live && <span className="live-dot" title="Идёт работа" />}
          <Icon name={source.icon} size={22} />
        </div>
      </div>
      <div className="ccard-bottom">
        <div className="ccard-amount">
          {p.int}
          <small>{p.frac}</small>
          <i> ₽</i>
        </div>
        <div className="ccard-meta">
          <span>{hoursShort(minutes)}</span>
          <span>{rate !== null ? `${money(rate)}/ч` : '— ₽/ч'}</span>
        </div>
      </div>
    </div>
  )
}

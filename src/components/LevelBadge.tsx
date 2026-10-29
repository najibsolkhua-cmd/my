import { Lock } from 'lucide-react'
import type { Level } from '../lib/levels'
import { Icon } from './Icon'

// Шестиугольный «игровой» значок уровня.
export function LevelBadge({ level, size = 56, locked = false, glow = false }: { level: Level; size?: number; locked?: boolean; glow?: boolean }) {
  const id = `lg${level.index}`
  return (
    <div className={`badge ${locked ? 'badge-locked' : ''} ${glow ? 'badge-glow' : ''}`} style={{ width: size, height: size, ['--glow' as string]: level.from }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={level.from} />
            <stop offset="1" stopColor={level.to} />
          </linearGradient>
        </defs>
        <path d="M50 3 L91 26.5 V73.5 L50 97 L9 73.5 V26.5 Z" fill={`url(#${id})`} />
        <path d="M50 11 L84 30.5 V69.5 L50 89 L16 69.5 V30.5 Z" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2.5" />
      </svg>
      <div className="badge-icon">{locked ? <Lock size={size * 0.32} /> : <Icon name={level.icon} size={size * 0.4} strokeWidth={2.2} />}</div>
      {size >= 48 && <div className="badge-num">{level.index}</div>}
    </div>
  )
}

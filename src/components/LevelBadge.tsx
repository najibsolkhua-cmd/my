import { Lock } from 'lucide-react'
import type { Level } from '../lib/levels'
import { Icon } from './Icon'

const V = [
  [50, 3],
  [91, 26.5],
  [91, 73.5],
  [50, 97],
  [9, 73.5],
  [9, 26.5],
] as const
// Точки по внутреннему контуру — чем выше уровень, тем больше «камней» горит.
const DOTS = Array.from({ length: 12 }, (_, i) => {
  const a = V[Math.floor(i / 2)]
  const b = V[(Math.floor(i / 2) + 1) % 6]
  const t = i % 2 ? 0.66 : 0.33
  const x = a[0] + (b[0] - a[0]) * t
  const y = a[1] + (b[1] - a[1]) * t
  return [50 + (x - 50) * 0.83, 50 + (y - 50) * 0.83] as const
})

/** Шестиугольный «огранённый» значок уровня. */
export function LevelBadge({ level, size = 56, locked = false, glow = false }: { level: Level; size?: number; locked?: boolean; glow?: boolean }) {
  const id = `lg${level.index}`
  const lit = Math.min(12, Math.round((level.index / 9) * 12))
  const num = Math.round(Math.max(18, size * 0.3))
  return (
    <div className={`badge ${locked ? 'badge-locked' : ''} ${glow ? 'badge-glow' : ''}`} style={{ width: size, height: size, ['--glow' as string]: level.from }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={level.from} />
            <stop offset="1" stopColor={level.to} />
          </linearGradient>
          <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M50 3 L91 26.5 V73.5 L50 97 L9 73.5 V26.5 Z" fill={`url(#${id})`} />
        {/* грани, как у камня */}
        {V.map(([x, y], i) => {
          const [nx, ny] = V[(i + 1) % 6]
          return <path key={i} d={`M50 50 L${x} ${y} L${nx} ${ny} Z`} fill={i % 2 ? '#000' : '#fff'} opacity={i % 2 ? 0.1 : 0.08} />
        })}
        <path d="M50 3 L91 26.5 L50 50 L9 26.5 Z" fill={`url(#${id}-gloss)`} />
        <path d="M50 11 L84 30.5 V69.5 L50 89 L16 69.5 V30.5 Z" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2.2" />
        {DOTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" opacity={i < lit ? 0.85 : 0.22} />
        ))}
        <circle cx="50" cy="50" r="21" fill="rgba(0,0,0,.18)" />
        <circle cx="50" cy="50" r="21" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" />
      </svg>
      <div className="badge-icon">{locked ? <Lock size={size * 0.3} /> : <Icon name={level.icon} size={size * 0.36} strokeWidth={2.2} />}</div>
      {size >= 48 && (
        <div className="badge-num" style={{ width: num, height: num, fontSize: Math.round(num * 0.56) }}>
          {level.index}
        </div>
      )}
    </div>
  )
}

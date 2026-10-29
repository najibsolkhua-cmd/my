import type { ReactNode } from 'react'

export function Donut({ parts, size = 180, thickness = 22, children }: { parts: { value: number; color: string }[]; size?: number; thickness?: number; children?: ReactNode }) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const total = parts.reduce((s, p) => s + p.value, 0)
  const gap = parts.length > 1 ? 3 : 0
  let offset = 0
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={thickness} />
        {total > 0 &&
          parts.map((p, i) => {
            const len = (p.value / total) * c
            const dash = Math.max(0, len - gap)
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={p.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )
            offset += len
            return el
          })}
      </svg>
      <div className="donut-center">{children}</div>
    </div>
  )
}

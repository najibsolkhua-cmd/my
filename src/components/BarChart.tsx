import { useEffect, useState } from 'react'
import { compact } from '../lib/format'

export interface Series {
  name: string
  color: string
  values: number[]
  format: (v: number) => string
}

interface Props {
  labels: string[]
  /** полные подписи для подсказки при нажатии */
  titles?: string[]
  series: Series[]
  height?: number
  /** индекс столбика «сегодня» — подсвечивается */
  current?: number
}

function niceMax(v: number): number {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  const f = v / p
  const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return n * p
}

export function BarChart({ labels, titles, series, height = 150, current }: Props) {
  const [sel, setSel] = useState<number | null>(null)
  useEffect(() => setSel(null), [labels.length, labels[0]])
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)))
  const many = labels.length > 14
  const step = labels.length > 20 ? 5 : labels.length > 14 ? 3 : 1
  const ticks = [1, 0.5, 0]
  const empty = series.every((s) => s.values.every((v) => v === 0))

  return (
    <div className="chart">
      <div className="chart-tip">
        {sel !== null ? (
          <>
            <b>{titles?.[sel] ?? labels[sel]}</b>
            {series.map((s) => (
              <span key={s.name}>
                <i style={{ background: s.color }} />
                {s.name}: {s.format(s.values[sel])}
              </span>
            ))}
          </>
        ) : (
          <span className="muted">{empty ? 'Пока нет данных за этот период' : 'Нажми на столбик, чтобы увидеть сумму'}</span>
        )}
      </div>
      <div className="chart-body" style={{ height }}>
        <div className="chart-grid">
          {ticks.map((t) => (
            <div key={t} className="chart-line" style={{ bottom: `${t * 100}%` }}>
              {!empty && <span>{compact(max * t)}</span>}
            </div>
          ))}
        </div>
        <div className="chart-bars">
          {labels.map((_, i) => (
            <button
              key={i}
              className={`chart-col ${sel === i ? 'sel' : ''} ${current === i ? 'cur' : ''}`}
              onClick={() => setSel(sel === i ? null : i)}
              aria-label={titles?.[i] ?? labels[i]}
            >
              <div className="chart-group" style={{ gap: many ? 1 : 3 }}>
                {series.map((s) => (
                  <div key={s.name} className="chart-bar" style={{ height: `${(s.values[i] / max) * 100}%`, background: s.color, borderRadius: many ? 3 : 6 }} />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="chart-labels">
        {labels.map((l, i) => (
          <span key={i} className={current === i ? 'cur' : ''}>
            {i % step === 0 || i === current ? l : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

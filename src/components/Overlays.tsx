import { useEffect, useMemo } from 'react'
import { useUI } from '../ui'
import type { Level } from '../lib/levels'
import { LevelBadge } from './LevelBadge'
import { money } from '../lib/format'
import { TIER_NAMES, type Achievement } from '../lib/achievements'
import { Icon } from './Icon'

export function Toast() {
  const toast = useUI((s) => s.toast)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => useUI.setState({ toast: null }), 2200)
    return () => clearTimeout(t)
  }, [toast])
  if (!toast) return null
  return (
    <div className="toast" key={toast.key} role="status">
      {toast.text}
    </div>
  )
}

export function ConfirmHost() {
  const c = useUI((s) => s.confirm)
  const answer = useUI((s) => s.answer)
  if (!c) return null
  return (
    <div className="confirm-wrap" onClick={() => answer(false)}>
      <div className="confirm" role="alertdialog" onClick={(e) => e.stopPropagation()}>
        <h3>{c.title}</h3>
        {c.text && <p>{c.text}</p>}
        <div className="confirm-actions">
          <button className="btn ghost" onClick={() => answer(false)}>
            Отмена
          </button>
          <button className={`btn ${c.danger ? 'danger' : 'primary'}`} onClick={() => answer(true)}>
            {c.ok}
          </button>
        </div>
      </div>
    </div>
  )
}

const CONFETTI_COLORS = ['#fde047', '#4ade80', '#7cb4ff', '#f472b6', '#fb923c', '#a78bfa']

export function LevelUp({ level, onClose }: { level: Level; onClose: () => void }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.8 + Math.random() * 1.6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rot: Math.random() * 360,
        w: 6 + Math.random() * 6,
      })),
    [],
  )
  return (
    <div className="levelup" onClick={onClose}>
      <div className="confetti" aria-hidden>
        {pieces.map((p, i) => (
          <i key={i} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, background: p.color, width: p.w, height: p.w * 0.45, transform: `rotate(${p.rot}deg)` }} />
        ))}
      </div>
      <div className="levelup-card" onClick={(e) => e.stopPropagation()}>
        <div className="levelup-kicker">Новый уровень!</div>
        <LevelBadge level={level} size={132} glow />
        <h2>{level.name}</h2>
        <p className="muted">Доход за 7 дней — от {money(level.min)}</p>
        <button className="btn primary wide" onClick={onClose}>
          Круто!
        </button>
      </div>
    </div>
  )
}

export function AchievementPopup({ a, more, onClose }: { a: Achievement; more: number; onClose: () => void }) {
  return (
    <div className="levelup" onClick={onClose}>
      <div className="levelup-card" onClick={(e) => e.stopPropagation()}>
        <div className="levelup-kicker">Новая награда · {TIER_NAMES[a.tier]}</div>
        <span className={`ach-icon big tier-${a.tier}`}>
          <Icon name={a.icon} size={44} />
        </span>
        <h2>{a.title}</h2>
        <p className="muted">{a.hint}</p>
        <button className="btn primary wide" onClick={onClose}>
          {more > 0 ? `Дальше (ещё ${more})` : 'Забрать'}
        </button>
      </div>
    </div>
  )
}

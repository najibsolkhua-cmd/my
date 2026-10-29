import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { plural } from '../lib/format'

/** Показывает историю порциями по дням, чтобы список не превращался в бесконечную ленту. */
export function usePaged<T>(items: T[], step = 10, resetKey?: unknown) {
  const [limit, setLimit] = useState(step)
  useEffect(() => setLimit(step), [resetKey, step])
  return {
    visible: items.slice(0, limit),
    more: (
      <ShowMore
        left={items.length - limit}
        step={step}
        onMore={() => setLimit(limit + step)}
        onCollapse={limit > step ? () => setLimit(step) : undefined}
      />
    ),
  }
}

function ShowMore({ left, step, onMore, onCollapse }: { left: number; step: number; onMore: () => void; onCollapse?: () => void }) {
  if (left <= 0 && !onCollapse) return null
  return (
    <div className="show-more">
      {left > 0 && (
        <button className="btn ghost wide sm" onClick={onMore}>
          <ChevronDown size={16} />
          Показать ещё {Math.min(step, left)} {plural(Math.min(step, left), ['день', 'дня', 'дней'])}
          <span className="muted"> · осталось {left}</span>
        </button>
      )}
      {onCollapse && (
        <button className="link" onClick={onCollapse}>
          Свернуть
        </button>
      )}
    </div>
  )
}

import { ChevronDown, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { money } from '../lib/format'
import { debtsSummary } from '../lib/money'
import { useStore } from '../store'
import { useUI } from '../ui'
import { Progress } from './Progress'

/** Долги: сколько осталось, кнопка «Погасить» и погашенные. */
export function DebtsPanel() {
  const debts = useStore((s) => s.debts)
  const expenses = useStore((s) => s.expenses)
  const open = useUI((s) => s.open)
  const [showClosed, setShowClosed] = useState(false)
  const sum = useMemo(() => debtsSummary({ debts, expenses }), [debts, expenses])

  return (
    <section className="panel">
      <div className="panel-head">
        <h3>Долги</h3>
        <button className="link" onClick={() => open({ type: 'debt' })}>
          <Plus size={16} /> Долг
        </button>
      </div>
      {sum.all.length === 0 && (
        <p className="muted">Долгов нет. Если что-то должен — запиши, и гаси его расходами с пометкой «В счёт долга».</p>
      )}
      {sum.open.length > 0 && (
        <div className="debt-total">
          <span className="muted">Осталось погасить</span>
          <b>{money(sum.left)}</b>
        </div>
      )}
      {sum.open.map((d) => (
        <div key={d.debt.id} className="debt">
          <button className="debt-main" onClick={() => open({ type: 'debt', edit: d.debt })}>
            <span className="debt-line">
              <b>{d.debt.title}</b>
              <span className="debt-left">{money(d.left)}</span>
            </span>
            <Progress value={d.ratio} color="var(--plus)" />
          </button>
          <div className="debt-foot">
            <small className="muted">
              погашено {money(d.paid)} из {money(d.debt.amount)}
            </small>
            <button className="btn ghost sm" onClick={() => open({ type: 'expense', debtId: d.debt.id, amount: d.left })}>
              Погасить
            </button>
          </div>
        </div>
      ))}
      {sum.closed.length > 0 && (
        <>
          <button className="archive-toggle" onClick={() => setShowClosed(!showClosed)}>
            Погашенные · {sum.closed.length}
            <ChevronDown size={18} style={{ transform: showClosed ? 'rotate(180deg)' : undefined }} />
          </button>
          {showClosed &&
            sum.closed.map((d) => (
              <button key={d.debt.id} className="debt closed" onClick={() => open({ type: 'debt', edit: d.debt })}>
                <span className="debt-line">
                  <b>✓ {d.debt.title}</b>
                  <span className="muted">{money(d.debt.amount)}</span>
                </span>
              </button>
            ))}
        </>
      )}
    </section>
  )
}

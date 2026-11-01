import type { AppData } from '../store'
import type { Debt, Expense } from '../types'
import { round2 } from './format'
import { sum } from './stats'

/** Сколько денег на счету сейчас: стартовый капитал + все доходы − все расходы. */
export function balanceOf(d: Pick<AppData, 'startCapital' | 'incomes' | 'expenses'>): number {
  return round2((d.startCapital ?? 0) + sum(d.incomes) - sum(d.expenses))
}

export interface DebtStatus {
  debt: Debt
  paid: number
  left: number
  ratio: number
  closed: boolean
  payments: number
}

/** Сколько по долгу уже заплачено и сколько осталось. */
export function debtStatus(debt: Debt, expenses: Expense[]): DebtStatus {
  const own = expenses.filter((x) => x.debtId === debt.id)
  const paid = sum(own)
  const left = round2(Math.max(0, debt.amount - paid))
  return { debt, paid, left, ratio: debt.amount > 0 ? Math.min(1, paid / debt.amount) : 1, closed: debt.amount > 0 && left <= 0, payments: own.length }
}

export function debtsSummary(d: Pick<AppData, 'debts' | 'expenses'>) {
  const all = d.debts.map((x) => debtStatus(x, d.expenses))
  const open = all.filter((x) => !x.closed)
  return { all, open, closed: all.filter((x) => x.closed), left: round2(open.reduce((s, x) => s + x.left, 0)) }
}

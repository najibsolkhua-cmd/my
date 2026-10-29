import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEFAULT_CATEGORIES } from './data/defaults'
import { round2 } from './lib/format'
import { uid } from './lib/ids'
import type { Category, Expense, Goal, Income, Shift, Source } from './types'

export interface AppData {
  sources: Source[]
  incomes: Income[]
  categories: Category[]
  expenses: Expense[]
  goals: Goal[]
  shift: Shift | null
  /** последний уровень, который пользователь уже «видел» — для анимации повышения */
  seenLevel: number
  /** лучший уровень за всё время */
  bestLevel: number
}

type New<T> = Omit<T, 'id' | 'createdAt'>

interface Actions {
  addSource: (s: New<Source>) => string
  updateSource: (id: string, patch: Partial<Source>) => void
  deleteSource: (id: string) => void
  addIncome: (x: New<Income>) => void
  updateIncome: (id: string, patch: Partial<Income>) => void
  deleteIncome: (id: string) => void
  addCategory: (c: Omit<Category, 'id'>) => string
  updateCategory: (id: string, patch: Partial<Category>) => void
  deleteCategory: (id: string) => void
  addExpense: (x: New<Expense>) => void
  updateExpense: (id: string, patch: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  addGoal: (g: New<Goal>) => void
  updateGoal: (id: string, patch: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  startShift: (sourceId: string) => void
  /** Останавливает смену и возвращает отработанные минуты. */
  stopShift: () => { sourceId: string; minutes: number } | null
  cancelShift: () => void
  setSeenLevel: (n: number) => void
  replaceAll: (data: AppData) => void
  resetAll: () => void
}

export const FALLBACK_CATEGORY = 'c-other'

export const initialData = (): AppData => ({
  sources: [],
  incomes: [],
  categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
  expenses: [],
  goals: [],
  shift: null,
  seenLevel: 0,
  bestLevel: 0,
})

const clean = (n: number) => round2(Math.max(0, n))

export const useStore = create<AppData & Actions>()(
  persist(
    (set, get) => ({
      ...initialData(),

      addSource: (s) => {
        const id = uid()
        set((st) => ({ sources: [...st.sources, { ...s, id, createdAt: Date.now() }] }))
        return id
      },
      updateSource: (id, patch) => set((st) => ({ sources: st.sources.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
      deleteSource: (id) =>
        set((st) => ({
          sources: st.sources.filter((s) => s.id !== id),
          incomes: st.incomes.filter((x) => x.sourceId !== id),
          shift: st.shift?.sourceId === id ? null : st.shift,
        })),

      addIncome: (x) =>
        set((st) => ({ incomes: [...st.incomes, { ...x, amount: clean(x.amount), minutes: Math.round(Math.max(0, x.minutes)), id: uid(), createdAt: Date.now() }] })),
      updateIncome: (id, patch) => set((st) => ({ incomes: st.incomes.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteIncome: (id) => set((st) => ({ incomes: st.incomes.filter((x) => x.id !== id) })),

      addCategory: (c) => {
        const id = uid()
        set((st) => ({ categories: [...st.categories, { ...c, id }] }))
        return id
      },
      updateCategory: (id, patch) => set((st) => ({ categories: st.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCategory: (id) => {
        if (id === FALLBACK_CATEGORY) return
        // расходы удалённой категории не теряются — переезжают в «Другое»
        set((st) => ({
          categories: st.categories.filter((c) => c.id !== id),
          expenses: st.expenses.map((x) => (x.categoryId === id ? { ...x, categoryId: FALLBACK_CATEGORY } : x)),
        }))
      },

      addExpense: (x) => set((st) => ({ expenses: [...st.expenses, { ...x, amount: clean(x.amount), id: uid(), createdAt: Date.now() }] })),
      updateExpense: (id, patch) => set((st) => ({ expenses: st.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteExpense: (id) => set((st) => ({ expenses: st.expenses.filter((x) => x.id !== id) })),

      addGoal: (g) => set((st) => ({ goals: [...st.goals, { ...g, id: uid(), createdAt: Date.now() }] })),
      updateGoal: (id, patch) => set((st) => ({ goals: st.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      deleteGoal: (id) => set((st) => ({ goals: st.goals.filter((g) => g.id !== id) })),

      startShift: (sourceId) => set({ shift: { sourceId, startedAt: Date.now() } }),
      stopShift: () => {
        const { shift } = get()
        if (!shift) return null
        set({ shift: null })
        return { sourceId: shift.sourceId, minutes: Math.max(1, Math.round((Date.now() - shift.startedAt) / 60000)) }
      },
      cancelShift: () => set({ shift: null }),

      setSeenLevel: (n) => set((st) => ({ seenLevel: n, bestLevel: Math.max(st.bestLevel, n) })),
      replaceAll: (data) => set({ ...initialData(), ...data }),
      resetAll: () => set(initialData()),
    }),
    {
      name: 'kapital-data',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (st): AppData => ({
        sources: st.sources,
        incomes: st.incomes,
        categories: st.categories,
        expenses: st.expenses,
        goals: st.goals,
        shift: st.shift,
        seenLevel: st.seenLevel,
        bestLevel: st.bestLevel,
      }),
    },
  ),
)

/** Достаёт только данные (без функций) — для экспорта. */
export function snapshot(): AppData {
  const st = useStore.getState()
  const { sources, incomes, categories, expenses, goals, shift, seenLevel, bestLevel } = st
  return { sources, incomes, categories, expenses, goals, shift, seenLevel, bestLevel }
}

const isArr = Array.isArray
const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isDate = (v: unknown): v is string => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v)

/** Проверка файла резервной копии. Возвращает данные или текст ошибки. */
export function validateBackup(raw: unknown): AppData | string {
  if (!raw || typeof raw !== 'object') return 'Файл не похож на резервную копию'
  const r = (raw as { data?: unknown }).data ?? raw
  const d = r as Partial<AppData>
  if (!isArr(d.sources) || !isArr(d.incomes) || !isArr(d.expenses) || !isArr(d.categories)) return 'В файле нет нужных разделов'
  for (const s of d.sources) if (!isStr(s?.id) || !isStr(s?.name)) return 'Повреждены карты'
  for (const x of d.incomes) if (!isStr(x?.id) || !isStr(x?.sourceId) || !isNum(x?.amount) || !isDate(x?.date)) return 'Повреждены записи доходов'
  for (const c of d.categories) if (!isStr(c?.id) || !isStr(c?.name)) return 'Повреждены категории'
  for (const x of d.expenses) if (!isStr(x?.id) || !isStr(x?.categoryId) || !isNum(x?.amount) || !isDate(x?.date)) return 'Повреждены записи расходов'
  const categories = d.categories.some((c) => c.id === FALLBACK_CATEGORY)
    ? d.categories
    : [...d.categories, DEFAULT_CATEGORIES.find((c) => c.id === FALLBACK_CATEGORY)!]
  return {
    sources: d.sources,
    incomes: d.incomes.map((x) => ({ ...x, minutes: isNum(x.minutes) ? x.minutes : 0, createdAt: isNum(x.createdAt) ? x.createdAt : 0 })),
    categories,
    expenses: d.expenses.map((x) => ({ ...x, createdAt: isNum(x.createdAt) ? x.createdAt : 0 })),
    goals: isArr(d.goals) ? d.goals : [],
    shift: null,
    seenLevel: isNum(d.seenLevel) ? d.seenLevel : 0,
    bestLevel: isNum(d.bestLevel) ? d.bestLevel : 0,
  }
}

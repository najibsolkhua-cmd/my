import { create } from 'zustand'
import type { Category, Expense, Goal, Income, Source } from './types'

export type Tab = 'home' | 'cards' | 'expenses' | 'levels'

export type Layer =
  | { type: 'add' }
  | { type: 'income'; edit?: Income; sourceId?: string; minutes?: number }
  | { type: 'expense'; edit?: Expense; categoryId?: string }
  | { type: 'source'; edit?: Source; onSaved?: (id: string) => void }
  | { type: 'category'; edit?: Category; onSaved?: (id: string) => void }
  | { type: 'goal'; edit?: Goal }
  | { type: 'pickSource'; purpose: 'shift' | 'income' }
  | { type: 'settings' }
  | { type: 'card'; sourceId: string }

interface Confirm {
  title: string
  text?: string
  ok: string
  danger?: boolean
  resolve: (v: boolean) => void
}

interface UI {
  tab: Tab
  layers: Layer[]
  toast: { text: string; key: number } | null
  confirm: Confirm | null
  setTab: (t: Tab) => void
  open: (l: Layer) => void
  /** Заменяет верхний слой (например, меню «+» → форма), не трогая историю браузера. */
  replace: (l: Layer) => void
  close: () => void
  /** Закрывает сразу несколько верхних слоёв. */
  closeMany: (n: number) => void
  syncDepth: (depth: number) => void
  showToast: (text: string) => void
  ask: (c: Omit<Confirm, 'resolve'>) => Promise<boolean>
  answer: (v: boolean) => void
}

// Слои (шторки и экраны) связаны с историей браузера, чтобы кнопка
// «назад» на Android и свайп назад закрывали шторку, а не приложение.
export const useUI = create<UI>()((set, get) => ({
  tab: 'home',
  layers: [],
  toast: null,
  confirm: null,
  setTab: (tab) => {
    set({ tab })
    window.scrollTo({ top: 0 })
  },
  open: (l) => {
    const depth = get().layers.length + 1
    set((s) => ({ layers: [...s.layers, l] }))
    try {
      history.pushState({ depth }, '')
    } catch {
      /* история недоступна — слои всё равно работают */
    }
  },
  replace: (l) => set((s) => ({ layers: s.layers.length ? [...s.layers.slice(0, -1), l] : [l] })),
  close: () => get().closeMany(1),
  closeMany: (n) => {
    const count = Math.min(n, get().layers.length)
    if (count <= 0) return
    set((s) => ({ layers: s.layers.slice(0, s.layers.length - count) }))
    try {
      const steps = Math.min(count, history.state?.depth ?? 0)
      if (steps > 0) history.go(-steps)
    } catch {
      /* ignore */
    }
  },
  syncDepth: (depth) => set((s) => (s.layers.length > depth ? { layers: s.layers.slice(0, depth) } : s)),
  showToast: (text) => set({ toast: { text, key: Date.now() } }),
  ask: (c) => new Promise<boolean>((resolve) => set({ confirm: { ...c, resolve } })),
  answer: (v) => {
    get().confirm?.resolve(v)
    set({ confirm: null })
  },
}))

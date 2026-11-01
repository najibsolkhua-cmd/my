import { create } from 'zustand'
import type { Category, Debt, Expense, Goal, Income, Source } from './types'

export type Tab = 'home' | 'cards' | 'expenses' | 'levels'
export const TABS: Tab[] = ['home', 'cards', 'expenses', 'levels']

// Вкладка переживает «потяни, чтобы обновить» (перезагрузку страницы).
function savedTab(): Tab {
  try {
    const t = sessionStorage.getItem('kapital-tab') as Tab | null
    return t && TABS.includes(t) ? t : 'home'
  } catch {
    return 'home'
  }
}

export type Layer =
  | { type: 'add' }
  | { type: 'income'; edit?: Income; sourceId?: string; minutes?: number }
  | { type: 'expense'; edit?: Expense; categoryId?: string; debtId?: string; amount?: number }
  | { type: 'capital' }
  | { type: 'debt'; edit?: Debt }
  | { type: 'source'; edit?: Source; onSaved?: (id: string) => void }
  | { type: 'category'; edit?: Category; onSaved?: (id: string) => void }
  | { type: 'goal'; edit?: Goal }
  | { type: 'pickSource'; purpose: 'shift' | 'income' }
  | { type: 'settings' }
  | { type: 'card'; sourceId: string }
  | { type: 'history' }

interface Confirm {
  title: string
  text?: string
  ok: string
  danger?: boolean
  resolve: (v: boolean) => void
}

/** Слой на экране. closing — проигрывает анимацию ухода и скоро исчезнет. */
export type LayerEntry = Layer & { key: number; closing?: boolean; swapped?: boolean }

/** Слои без тех, что уже закрываются. */
export const activeLayers = (s: { layers: LayerEntry[] }) => s.layers.filter((l) => !l.closing)

const EXIT_MS = 300
let seq = 0

interface UI {
  tab: Tab
  layers: LayerEntry[]
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
// Закрытие анимированное: слой помечается closing и удаляется после анимации.
export const useUI = create<UI>()((set, get) => {
  const markClosing = (count: number) => {
    if (count <= 0) return
    set((s) => {
      const layers = [...s.layers]
      let left = count
      for (let i = layers.length - 1; i >= 0 && left > 0; i--) {
        if (!layers[i].closing) {
          layers[i] = { ...layers[i], closing: true }
          left--
        }
      }
      return { layers }
    })
    setTimeout(() => set((s) => ({ layers: s.layers.filter((l) => !l.closing) })), EXIT_MS)
  }

  return {
    tab: savedTab(),
    layers: [],
    toast: null,
    confirm: null,
    setTab: (tab) => {
      set({ tab })
      try {
        sessionStorage.setItem('kapital-tab', tab)
      } catch {
        /* ignore */
      }
    },
    open: (l) => {
      const depth = activeLayers(get()).length + 1
      set((s) => ({ layers: [...s.layers, { ...l, key: ++seq }] }))
      try {
        history.pushState({ depth }, '')
      } catch {
        /* история недоступна — слои всё равно работают */
      }
    },
    replace: (l) =>
      set((s) => {
        const layers = [...s.layers]
        for (let i = layers.length - 1; i >= 0; i--) {
          if (!layers[i].closing) {
            layers[i] = { ...l, key: layers[i].key, swapped: true }
            return { layers }
          }
        }
        return { layers: [...layers, { ...l, key: ++seq }] }
      }),
    close: () => get().closeMany(1),
    closeMany: (n) => {
      const count = Math.min(n, activeLayers(get()).length)
      if (count <= 0) return
      markClosing(count)
      try {
        const steps = Math.min(count, history.state?.depth ?? 0)
        if (steps > 0) history.go(-steps)
      } catch {
        /* ignore */
      }
    },
    syncDepth: (depth) => markClosing(activeLayers(get()).length - depth),
    showToast: (text) => set({ toast: { text, key: Date.now() } }),
    ask: (c) => new Promise<boolean>((resolve) => set({ confirm: { ...c, resolve } })),
    answer: (v) => {
      get().confirm?.resolve(v)
      set({ confirm: null })
    },
  }
})

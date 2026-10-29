import { Home, Layers, Plus, Trophy, Wallet } from 'lucide-react'
import { useUI, type Tab } from '../ui'

const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Главная', icon: Home },
  { key: 'cards', label: 'Карты', icon: Layers },
  { key: 'expenses', label: 'Расходы', icon: Wallet },
  { key: 'levels', label: 'Уровни', icon: Trophy },
]

export function BottomNav() {
  const tab = useUI((s) => s.tab)
  const setTab = useUI((s) => s.setTab)
  const open = useUI((s) => s.open)
  const item = (t: (typeof TABS)[number]) => (
    <button key={t.key} className={`nav-item ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
      <t.icon size={22} strokeWidth={tab === t.key ? 2.4 : 1.9} />
      <span>{t.label}</span>
    </button>
  )
  return (
    <nav className="nav">
      {TABS.slice(0, 2).map(item)}
      <button className="nav-fab" onClick={() => open({ type: 'add' })} aria-label="Добавить">
        <Plus size={28} strokeWidth={2.6} />
      </button>
      {TABS.slice(2).map(item)}
    </nav>
  )
}

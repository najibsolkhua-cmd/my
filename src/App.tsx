import { useEffect } from 'react'
import { BottomNav } from './components/BottomNav'
import { ConfirmHost, LevelUp, Toast } from './components/Overlays'
import { useToday } from './hooks'
import { LEVELS, levelFor } from './lib/levels'
import { last7 } from './lib/stats'
import { CardDetail } from './screens/CardDetail'
import { Cards } from './screens/Cards'
import { Expenses } from './screens/Expenses'
import { Home } from './screens/Home'
import { Levels } from './screens/Levels'
import { AddMenu } from './sheets/AddMenu'
import { CategoryForm } from './sheets/CategoryForm'
import { ExpenseForm } from './sheets/ExpenseForm'
import { GoalForm } from './sheets/GoalForm'
import { IncomeForm } from './sheets/IncomeForm'
import { PickSource } from './sheets/PickSource'
import { Settings } from './sheets/Settings'
import { SourceForm } from './sheets/SourceForm'
import { useStore } from './store'
import { useUI, type Layer } from './ui'

function renderLayer(l: Layer) {
  switch (l.type) {
    case 'add':
      return <AddMenu />
    case 'income':
      return <IncomeForm edit={l.edit} sourceId={l.sourceId} minutes={l.minutes} />
    case 'expense':
      return <ExpenseForm edit={l.edit} categoryId={l.categoryId} />
    case 'source':
      return <SourceForm edit={l.edit} onSaved={l.onSaved} />
    case 'category':
      return <CategoryForm edit={l.edit} onSaved={l.onSaved} />
    case 'goal':
      return <GoalForm edit={l.edit} />
    case 'pickSource':
      return <PickSource purpose={l.purpose} />
    case 'settings':
      return <Settings />
    case 'card':
      return <CardDetail sourceId={l.sourceId} />
  }
}

export function App() {
  const tab = useUI((s) => s.tab)
  const layers = useUI((s) => s.layers)
  const incomes = useStore((s) => s.incomes)
  const seenLevel = useStore((s) => s.seenLevel)
  const now = useToday()
  const level = levelFor(last7(incomes, now))

  // Кнопка «назад» закрывает верхнюю шторку / экран.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => useUI.getState().syncDepth(e.state?.depth ?? 0)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Уровень упал — тихо запоминаем, чтобы при следующем росте снова был праздник.
  useEffect(() => {
    if (level.index < seenLevel) useStore.getState().setSeenLevel(level.index)
  }, [level.index, seenLevel])

  // Блокируем прокрутку фона, пока открыта шторка.
  const sheetOpen = layers.some((l) => l.type !== 'card')
  useEffect(() => {
    document.body.classList.toggle('locked', sheetOpen)
  }, [sheetOpen])

  // Экран карты — полноэкранный слой; поверх него могут быть шторки.
  const lastCard = layers.map((l) => l.type).lastIndexOf('card')

  return (
    <div className="app">
      <main aria-hidden={lastCard >= 0}>
        {tab === 'home' && <Home />}
        {tab === 'cards' && <Cards />}
        {tab === 'expenses' && <Expenses />}
        {tab === 'levels' && <Levels />}
      </main>
      {layers.map((l, i) => {
        if (l.type === 'card') return i === lastCard ? <CardDetail key={`${i}-card`} sourceId={l.sourceId} /> : null
        return <div key={`${i}-${l.type}`}>{renderLayer(l)}</div>
      })}
      {lastCard < 0 && <BottomNav />}
      {level.index > seenLevel && <LevelUp level={LEVELS[level.index]} onClose={() => useStore.getState().setSeenLevel(level.index)} />}
      <ConfirmHost />
      <Toast />
    </div>
  )
}

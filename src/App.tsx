import { useEffect, useMemo, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { Pager } from './components/Pager'
import { AchievementPopup, ConfirmHost, LevelUp, Toast } from './components/Overlays'
import { useToday } from './hooks'
import { achievements } from './lib/achievements'
import { LEVELS, levelFor } from './lib/levels'
import { last7 } from './lib/stats'
import { CardDetail } from './screens/CardDetail'
import { History } from './screens/History'
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

const FULLSCREEN: Layer['type'][] = ['card', 'history']

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
    case 'history':
      return <History />
  }
}

/** Ждёт, пока данные загрузятся из хранилища телефона. */
function useHydrated() {
  const [ready, setReady] = useState(() => useStore.persist.hasHydrated())
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setReady(true))
    setReady(useStore.persist.hasHydrated())
    return unsub
  }, [])
  return ready
}

export function App() {
  const ready = useHydrated()
  return ready ? <Main /> : null
}

function Main() {
  const layers = useUI((s) => s.layers)
  const data = useStore()
  const now = useToday()
  const level = levelFor(last7(data.incomes, now))
  const [queue, setQueue] = useState<string[]>([])

  // Кнопка «назад» закрывает верхнюю шторку / экран.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => useUI.getState().syncDepth(e.state?.depth ?? 0)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Уровень упал — тихо запоминаем, чтобы при следующем росте снова был праздник.
  useEffect(() => {
    if (level.index < data.seenLevel) data.setSeenLevel(level.index)
  }, [level.index, data.seenLevel])

  // Новые награды: запоминаем навсегда и показываем по одной.
  const ach = useMemo(() => achievements(data, now), [data.incomes, data.expenses, data.sources, data.goals, data.counters, data.bestLevel, data.earned, now])
  useEffect(() => {
    const done = ach.filter((a) => a.done).map((a) => a.id)
    if (data.earned === null) {
      data.setEarned(done) // первый запуск после обновления — без салюта за старые заслуги
      return
    }
    const fresh = done.filter((id) => !data.earned!.includes(id))
    if (fresh.length) {
      data.setEarned([...data.earned, ...fresh])
      setQueue((q) => [...q, ...fresh])
    }
  }, [ach])

  // Полноэкранный слой (карта, история) — поверх него могут быть шторки.
  let lastFull = -1
  layers.forEach((l, i) => FULLSCREEN.includes(l.type) && (lastFull = i))
  // праздник — когда пользователь закончил ввод и закрыл форму, а не поверх неё
  const calm = layers.every((l) => FULLSCREEN.includes(l.type))
  const levelUp = calm && level.index > data.seenLevel
  const popup = calm && !levelUp && queue.length ? ach.find((a) => a.id === queue[0]) : undefined

  return (
    <div className="app">
      <div className="app-bg" aria-hidden />
      <main aria-hidden={lastFull >= 0}>
        <Pager />
      </main>
      {layers.map((l, i) => {
        if (FULLSCREEN.includes(l.type) && i !== lastFull) return null
        return <div key={`${i}-${l.type}`}>{renderLayer(l)}</div>
      })}
      {lastFull < 0 && <BottomNav />}
      {levelUp && <LevelUp level={LEVELS[level.index]} onClose={() => data.setSeenLevel(level.index)} />}
      {popup && <AchievementPopup a={popup} more={queue.length - 1} onClose={() => setQueue((q) => q.slice(1))} />}
      <ConfirmHost />
      <Toast />
    </div>
  )
}

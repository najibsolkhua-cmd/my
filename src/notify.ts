import { registerPlugin } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { cardColor } from './data/palette'
import { IDS, MANAGED, planNotifications } from './lib/notifyPlan'
import { isNative, platform } from './platform'
import { useStore, type AppData } from './store'

interface LiveActivityPlugin {
  isAvailable(): Promise<{ available: boolean }>
  start(o: { name: string; color: string; ink: string; symbol: string; startedAt: number }): Promise<{ started: boolean; error?: string }>
  end(): Promise<void>
}
const LiveActivity = registerPlugin<LiveActivityPlugin>('LiveActivity')

// Иконки карт → значки SF Symbols для экрана блокировки iPhone.
const SF_SYMBOLS: Record<string, string> = {
  Bike: 'bicycle', CarTaxiFront: 'car.fill', Truck: 'truck.box.fill', Package: 'shippingbox.fill', Briefcase: 'briefcase.fill',
  Laptop: 'laptopcomputer', Code: 'chevron.left.forwardslash.chevron.right', Camera: 'camera.fill', Rocket: 'paperplane.fill',
  Building2: 'building.2.fill', Store: 'bag.fill', TrendingUp: 'chart.line.uptrend.xyaxis', Hammer: 'hammer.fill',
  Wrench: 'wrench.fill', Drill: 'wrench.and.screwdriver.fill', Palette: 'paintpalette.fill', Brush: 'paintbrush.fill',
  Music: 'music.note', GraduationCap: 'graduationcap.fill', Coins: 'dollarsign.circle.fill', Bitcoin: 'bitcoinsign.circle.fill',
  House: 'house.fill', Handshake: 'person.2.fill', HandCoins: 'banknote.fill', Scissors: 'scissors', Utensils: 'fork.knife',
  Gem: 'diamond.fill', Sparkles: 'sparkles',
}

// Плагин нельзя возвращать из async-функции: прокси Capacitor притворяется промисом
// (у него есть «then»), и вызов падает. Поэтому — прямая ссылка.
const plugin = () => LocalNotifications

/** Включены ли Live Activity для приложения в настройках iPhone. */
export async function liveActivityAvailable(): Promise<boolean> {
  if (platform !== 'ios') return platform === 'android'
  try {
    return (await LiveActivity.isAvailable()).available
  } catch {
    return false
  }
}

/** Спрашивает разрешение на уведомления. true — разрешено. */
export async function requestNotifications(): Promise<boolean> {
  if (!isNative) return false
  const ln = plugin()
  const current = await ln.checkPermissions()
  if (current.display === 'granted') return true
  const res = await ln.requestPermissions()
  return res.display === 'granted'
}

let channelsReady = false
async function ensureChannels() {
  if (platform !== 'android' || channelsReady) return
  const ln = plugin()
  await ln.createChannel({ id: 'reminders', name: 'Напоминания', description: 'Напоминания и итоги недели', importance: 4 })
  await ln.createChannel({ id: 'shift', name: 'Таймер работы', description: 'Таймер работы в шторке', importance: 2, vibration: false })
  channelsReady = true
}

/** Приводит расписание уведомлений в соответствие с данными. */
async function syncScheduled(d: AppData) {
  const ln = plugin()
  const pending = await ln.getPending()
  const ours = pending.notifications.filter((n) => MANAGED(n.id))
  if (ours.length) await ln.cancel({ notifications: ours.map((n) => ({ id: n.id })) })
  const plan = planNotifications(d, new Date())
  if (!plan.length) return
  const granted = (await ln.checkPermissions()).display === 'granted'
  if (!granted) return
  await ensureChannels()
  await ln.schedule({
    notifications: plan.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      schedule: { at: n.at, allowWhileIdle: true },
      channelId: 'reminders',
      smallIcon: 'ic_stat_notify',
      iconColor: '#7CB4FF',
    })),
  })
}

let lastShiftKey = ''
/** Таймер работы: Live Activity на iPhone, постоянное уведомление на Android. */
async function syncShift(d: AppData) {
  const show = d.settings.liveActivity && d.shift ? d.shift : null
  const source = show ? d.sources.find((s) => s.id === show.sourceId) : undefined
  const key = show && source ? `${show.startedAt}-${source.name}-${source.color}` : ''
  if (key === lastShiftKey) return
  lastShiftKey = key

  if (platform === 'ios') {
    if (show && source) {
      const c = cardColor(source.color)
      await LiveActivity.start({ name: source.name, color: c.base, ink: c.ink, symbol: SF_SYMBOLS[source.icon] ?? 'timer', startedAt: show.startedAt })
    } else await LiveActivity.end()
    return
  }

  if (platform === 'android') {
    const ln = plugin()
    await ln.removeDeliveredNotificationsById({ ids: [IDS.ongoing] }).catch(() => {})
    if (!show || !source) return
    if ((await ln.checkPermissions()).display !== 'granted') return
    await ensureChannels()
    const started = new Date(show.startedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    await ln.schedule({
      notifications: [
        { id: IDS.ongoing, title: `Идёт работа · ${source.name}`, body: `Таймер запущен в ${started}. Нажми, чтобы остановить.`, ongoing: true, autoCancel: false, channelId: 'shift', smallIcon: 'ic_stat_notify', iconColor: '#7CB4FF' },
      ],
    })
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
/** Пересчитывает уведомления и таймер работы (с небольшой задержкой, чтобы не дёргать на каждое изменение). */
export function scheduleSync(delay = 800) {
  if (!isNative) return
  clearTimeout(timer)
  timer = setTimeout(() => {
    const d = useStore.getState()
    syncShift(d).catch(() => {})
    syncScheduled(d).catch(() => {})
  }, delay)
}

/** Запускает синхронизацию при изменении данных и при возврате в приложение. */
export async function setupNotifications() {
  if (!isNative) return
  useStore.subscribe((s, prev) => {
    if (s.incomes !== prev.incomes || s.expenses !== prev.expenses || s.shift !== prev.shift || s.settings !== prev.settings || s.sources !== prev.sources) scheduleSync()
  })
  const { App } = await import('@capacitor/app')
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      lastShiftKey = '' // Live Activity могла закончиться сама (лимит iOS — 8 часов)
      scheduleSync(300)
    }
  })
  scheduleSync(300)
}

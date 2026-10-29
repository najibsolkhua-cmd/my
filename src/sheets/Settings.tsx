import { Bell, Download, RotateCcw, Smartphone, Timer, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { Toggle } from '../components/Toggle'
import { today } from '../lib/dates'
import { isNative, saveTextFile } from '../native'
import { liveActivityAvailable, requestNotifications } from '../notify'
import { platform } from '../platform'
import { snapshot, useStore, validateBackup } from '../store'
import { useUI } from '../ui'

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const { showToast, ask, close } = useUI.getState()
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const [laAvailable, setLaAvailable] = useState(true)

  useEffect(() => {
    if (platform === 'ios') liveActivityAvailable().then(setLaAvailable)
  }, [])

  const exportData = async () => {
    const json = JSON.stringify({ app: 'kapital', version: 2, exportedAt: new Date().toISOString(), data: snapshot() }, null, 2)
    try {
      if (await saveTextFile(`kapital-${today()}.json`, json, 'application/json')) showToast('Копия готова')
    } catch {
      showToast('Не удалось сохранить копию')
    }
  }

  const importData = async (file: File) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      showToast('Это не файл резервной копии')
      return
    }
    const res = validateBackup(parsed)
    if (typeof res === 'string') {
      showToast(res)
      return
    }
    const counts = `${res.sources.length} карт, ${res.incomes.length} доходов, ${res.expenses.length} расходов`
    if (await ask({ title: 'Восстановить из копии?', text: `В копии: ${counts}. Текущие данные будут заменены.`, ok: 'Восстановить', danger: true })) {
      useStore.getState().replaceAll(res)
      showToast('Данные восстановлены')
      close()
    }
  }

  const reset = async () => {
    if (!(await ask({ title: 'Стереть всё?', text: 'Все карты, доходы, расходы и цели будут удалены. Сначала сохрани резервную копию, если данные нужны.', ok: 'Стереть', danger: true }))) return
    if (!(await ask({ title: 'Точно стереть?', text: 'Восстановить данные без копии будет невозможно.', ok: 'Да, стереть всё', danger: true }))) return
    useStore.getState().resetAll()
    showToast('Все данные удалены')
    close()
  }

  const toggleNotifications = async (on: boolean) => {
    if (!on) {
      setSettings({ notifications: false })
      return
    }
    let granted = false
    try {
      granted = await requestNotifications()
    } catch {
      granted = false
    }
    if (granted) {
      setSettings({ notifications: true })
      showToast('Уведомления включены')
    } else {
      setSettings({ notifications: false })
      await ask({
        title: 'Уведомления запрещены',
        text: platform === 'ios' ? 'Разреши их: Настройки iPhone → Капитал → Уведомления.' : 'Разреши их в настройках телефона: Приложения → Капитал → Уведомления.',
        ok: 'Понятно',
      })
    }
  }

  const toggleLive = async (on: boolean) => {
    if (on && platform === 'android' && !(await requestNotifications().catch(() => false))) {
      showToast('Разреши уведомления, чтобы видеть таймер в шторке')
      return
    }
    setSettings({ liveActivity: on })
  }

  return (
    <Sheet title="Настройки">
      {isNative ? (
        <>
          <div className="settings-group">
            <div className="settings-title">
              <Timer size={16} /> Таймер смены
            </div>
            <Toggle
              checked={settings.liveActivity}
              onChange={toggleLive}
              label={platform === 'ios' ? 'На экране блокировки и в Dynamic Island' : 'В шторке уведомлений'}
              hint={
                platform === 'ios' && !laAvailable
                  ? 'Live Activity выключены: Настройки iPhone → Капитал → Live Activity'
                  : 'Секундомер идёт, даже когда приложение закрыто'
              }
            />
          </div>
          <div className="settings-group">
            <div className="settings-title">
              <Bell size={16} /> Уведомления
            </div>
            <Toggle checked={settings.notifications} onChange={toggleNotifications} label="Уведомления" hint="Напоминания, смены, итоги недели" />
            {settings.notifications && (
              <>
                <Toggle checked={settings.daily} onChange={(v) => setSettings({ daily: v })} label="Напомнить записать доход" hint="Не придёт, если сегодня уже записал" />
                {settings.daily && (
                  <label className="toggle-row">
                    <span className="toggle-text">
                      <b>Время напоминания</b>
                    </span>
                    <input type="time" className="input time-input" value={settings.dailyTime} onChange={(e) => e.target.value && setSettings({ dailyTime: e.target.value })} />
                  </label>
                )}
                <Toggle checked={settings.shiftAlerts} onChange={(v) => setSettings({ shiftAlerts: v })} label="Долгая смена" hint="Через 4, 8 и 12 часов — чтобы не забыть её завершить" />
                <Toggle checked={settings.weekly} onChange={(v) => setSettings({ weekly: v })} label="Итоги недели" hint="По понедельникам в 10:00" />
              </>
            )}
          </div>
        </>
      ) : (
        <div className="note">
          <Bell size={18} />
          <p>Уведомления и таймер смены на экране блокировки работают в приложении для iPhone и Android.</p>
        </div>
      )}

      <div className="settings-group">
        <div className="settings-title">Данные</div>
        <div className="menu">
          <button className="menu-item" onClick={exportData}>
            <Download size={20} />
            <span>
              <b>Сохранить резервную копию</b>
              <small>в Файлы, Telegram, почту — работает без интернета</small>
            </span>
          </button>
          <button className="menu-item" onClick={() => fileRef.current?.click()}>
            <Upload size={20} />
            <span>
              <b>Восстановить из копии</b>
              <small>выбери ранее сохранённый файл .json</small>
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) importData(f)
            }}
          />
          <button className="menu-item danger" onClick={reset}>
            <RotateCcw size={20} />
            <span>
              <b>Стереть все данные</b>
              <small>начать с чистого листа</small>
            </span>
          </button>
        </div>
      </div>

      <div className="note">
        <Smartphone size={18} />
        <p>
          Все данные хранятся только на этом телефоне и работают без интернета. Раз в неделю-две сохраняй резервную копию.
          {!isNative && ' Установить: iPhone — Safari → «Поделиться» → «На экран Домой»; Android — Chrome → ⋮ → «Добавить на главный экран».'}
        </p>
      </div>
      <p className="muted center version">Капитал {__APP_VERSION__}</p>
    </Sheet>
  )
}

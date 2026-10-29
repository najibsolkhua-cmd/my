import { Download, RotateCcw, Smartphone, Sparkles, Upload } from 'lucide-react'
import { useRef } from 'react'
import { Sheet } from '../components/Sheet'
import { demoData } from '../data/demo'
import { today } from '../lib/dates'
import { snapshot, useStore, validateBackup } from '../store'
import { useUI } from '../ui'

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null)
  const { showToast, ask, close } = useUI.getState()
  const hasData = useStore((s) => s.sources.length + s.incomes.length + s.expenses.length > 0)

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ app: 'kapital', version: 1, exportedAt: new Date().toISOString(), data: snapshot() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kapital-${today()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    showToast('Копия сохранена')
  }

  const importData = async (file: File) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      showToast('Не удалось прочитать файл')
      return
    }
    const res = validateBackup(parsed)
    if (typeof res === 'string') {
      showToast(res)
      return
    }
    if (await ask({ title: 'Восстановить из копии?', text: 'Текущие данные будут заменены данными из файла.', ok: 'Восстановить', danger: true })) {
      useStore.getState().replaceAll(res)
      showToast('Данные восстановлены')
      close()
    }
  }

  const loadDemo = async () => {
    if (hasData && !(await ask({ title: 'Загрузить демо?', text: 'Текущие данные будут заменены примером. Сначала сохрани копию, если они важны.', ok: 'Загрузить', danger: true }))) return
    useStore.getState().replaceAll(demoData(today()))
    showToast('Демо-данные загружены')
    close()
  }

  const reset = async () => {
    if (await ask({ title: 'Стереть всё?', text: 'Все карты, доходы, расходы и цели будут удалены без возможности восстановления.', ok: 'Стереть', danger: true })) {
      useStore.getState().resetAll()
      showToast('Все данные удалены')
      close()
    }
  }

  return (
    <Sheet title="Настройки">
      <div className="menu">
        <button className="menu-item" onClick={exportData}>
          <Download size={20} />
          <span>
            <b>Сохранить резервную копию</b>
            <small>файл .json — на случай смены телефона</small>
          </span>
        </button>
        <button className="menu-item" onClick={() => fileRef.current?.click()}>
          <Upload size={20} />
          <span>
            <b>Восстановить из копии</b>
            <small>выбери ранее сохранённый файл</small>
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
        <button className="menu-item" onClick={loadDemo}>
          <Sparkles size={20} />
          <span>
            <b>Демо-данные</b>
            <small>посмотреть, как всё выглядит с данными</small>
          </span>
        </button>
        <button className="menu-item danger" onClick={reset}>
          <RotateCcw size={20} />
          <span>
            <b>Стереть все данные</b>
            <small>начать с чистого листа</small>
          </span>
        </button>
      </div>
      <div className="note">
        <Smartphone size={18} />
        <p>
          <b>Установить на телефон.</b> iPhone: Safari → «Поделиться» → «На экран Домой». Android: Chrome → меню ⋮ → «Добавить на главный экран». Данные хранятся только на этом устройстве.
        </p>
      </div>
    </Sheet>
  )
}

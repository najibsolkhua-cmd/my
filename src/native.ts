import { isNative } from './platform'
import { activeLayers, useUI } from './ui'

export { isNative }

/** Системная кнопка «назад» Android: закрывает окно, потом ведёт на главную, потом выходит. */
export async function setupNative() {
  if (!isNative) return
  const { App } = await import('@capacitor/app')
  App.addListener('backButton', () => {
    const ui = useUI.getState()
    if (ui.confirm) ui.answer(false)
    else if (activeLayers(ui).length) ui.close()
    else if (ui.tab !== 'home') ui.setTab('home')
    else App.exitApp()
  })
}

/**
 * Сохраняет файл без интернета. В приложении и на iPhone открывается системное меню
 * «Поделиться» (там есть «Сохранить в Файлы», Telegram, почта), в остальных браузерах — скачивание.
 * Возвращает false, если пользователь закрыл меню.
 */
export async function saveTextFile(name: string, text: string, mime: string): Promise<boolean> {
  if (isNative) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
    const { Share } = await import('@capacitor/share')
    const { uri } = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 })
    try {
      await Share.share({ title: name, url: uri, dialogTitle: 'Сохранить резервную копию' })
      return true
    } catch {
      return false
    }
  }
  const file = new File([text], name, { type: mime })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
      return true
    } catch (e) {
      if ((e as Error).name === 'AbortError') return false
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}

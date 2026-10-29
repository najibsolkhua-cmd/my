import { Capacitor } from '@capacitor/core'
import { useUI } from './ui'

/** Запущено как приложение на телефоне (APK), а не в браузере. */
export const isNative = Capacitor.isNativePlatform()

/** Системная кнопка «назад» Android: закрывает окно, потом ведёт на главную, потом выходит. */
export async function setupNative() {
  if (!isNative) return
  const { App } = await import('@capacitor/app')
  App.addListener('backButton', () => {
    const ui = useUI.getState()
    if (ui.confirm) ui.answer(false)
    else if (ui.layers.length) ui.close()
    else if (ui.tab !== 'home') ui.setTab('home')
    else App.exitApp()
  })
}

/** Сохраняет файл: в браузере — скачиванием, в приложении — через меню «Поделиться». */
export async function saveTextFile(name: string, text: string, mime: string) {
  if (isNative) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
    const { Share } = await import('@capacitor/share')
    const { uri } = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 })
    await Share.share({ title: name, url: uri, dialogTitle: 'Сохранить резервную копию' })
    return
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

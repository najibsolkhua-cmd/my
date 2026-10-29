import { Keyboard } from '@capacitor/keyboard'
import { isNative } from './platform'

const root = document.documentElement

/**
 * Высота приложения. В режиме «На экран Домой» новые iOS иногда отдают окно
 * короче экрана — снизу появляется чёрная полоса. Берём настоящую высоту экрана.
 */
function fitHeight() {
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
  const portrait = window.innerHeight >= window.innerWidth
  const h = standalone && portrait ? Math.max(window.innerHeight, screen.height) : window.innerHeight
  root.style.setProperty('--app-h', `${h}px`)
}

function setKeyboard(h: number) {
  const open = h > 80
  const wasOpen = root.classList.contains('kb-open')
  root.style.setProperty('--kb', `${open ? Math.round(h) : 0}px`)
  root.classList.toggle('kb-open', open)
  // шторка поднялась — прокручиваем её так, чтобы поле с курсором было видно
  if (open && !wasOpen) {
    setTimeout(() => {
      const el = document.activeElement as HTMLElement | null
      if (el?.closest('.sheet-body')) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 280)
  }
}

/**
 * Клавиатура выезжает поверх и ничего не толкает: экран стоит на месте,
 * а поднимается только шторка с полем ввода — ровно на высоту клавиатуры.
 */
export function setupViewport() {
  fitHeight()
  let lastWidth = window.innerWidth
  window.addEventListener('resize', () => {
    // в браузере клавиатура меняет высоту окна — пересчитываем только при повороте
    if (window.innerWidth !== lastWidth || !root.classList.contains('kb-open')) fitHeight()
    lastWidth = window.innerWidth
  })

  if (isNative) {
    Keyboard.addListener('keyboardWillShow', (info) => setKeyboard(info.keyboardHeight)).catch(() => {})
    Keyboard.addListener('keyboardWillHide', () => setKeyboard(0)).catch(() => {})
    return
  }

  const vv = window.visualViewport
  if (!vv) return
  const update = () => {
    setKeyboard(window.innerHeight - vv.height)
    // iOS сдвигает всю страницу к полю ввода — возвращаем её на место
    if (root.classList.contains('kb-open') && (window.scrollY !== 0 || vv.offsetTop !== 0)) window.scrollTo(0, 0)
  }
  vv.addEventListener('resize', update)
  vv.addEventListener('scroll', update)
}

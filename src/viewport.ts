import { Keyboard } from '@capacitor/keyboard'
import { isNative } from './platform'

const root = document.documentElement
let appHeight = window.innerHeight

/**
 * Высота приложения. iOS в режиме «На экран Домой» иногда отдаёт окно короче экрана
 * (особенно после того, как закрылась клавиатура) — снизу появлялась полоса и обрезалась панель.
 * Берём настоящую высоту экрана; html и body получают её же, чтобы ничего не обрезали.
 */
function fitHeight() {
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
  const portrait = window.innerHeight >= window.innerWidth
  appHeight = standalone && portrait ? Math.max(window.innerHeight, screen.height) : window.innerHeight
  root.style.setProperty('--app-h', `${appHeight}px`)
}

function setKeyboard(h: number) {
  const open = h > 0
  const wasOpen = root.classList.contains('kb-open')
  root.style.setProperty('--kb', `${open ? Math.round(h) : 0}px`)
  root.classList.toggle('kb-open', open)
  // шторка поднялась — прокручиваем её так, чтобы поле с курсором было видно
  if (open && !wasOpen) {
    setTimeout(() => {
      const el = document.activeElement as HTMLElement | null
      if (el?.closest('.sheet-body')) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 300)
  }
}

/**
 * Клавиатура выезжает поверх и ничего не сдвигает.
 * iOS при фокусе на поле сдвигает видимую область вверх — приложение сдвигается
 * на столько же обратно и остаётся на месте; поднимается только шторка с полем —
 * ровно до верхнего края клавиатуры.
 */
export function setupViewport() {
  fitHeight()
  let lastWidth = window.innerWidth
  window.addEventListener('resize', () => {
    if (window.innerWidth !== lastWidth || !root.classList.contains('kb-open')) fitHeight()
    lastWidth = window.innerWidth
  })

  if (isNative) {
    // В приложении WebView не сдвигается (Keyboard.resize = none) — нужна только высота клавиатуры.
    Keyboard.addListener('keyboardWillShow', (info) => setKeyboard(info.keyboardHeight)).catch(() => {})
    Keyboard.addListener('keyboardWillHide', () => setKeyboard(0)).catch(() => {})
    return
  }

  const vv = window.visualViewport
  if (!vv) return
  let frame = 0
  const apply = () => {
    frame = 0
    const app = document.querySelector<HTMLElement>('.app')
    const open = vv.height < window.innerHeight - 80
    // компенсируем сдвиг, который сделала iOS
    const shift = open ? Math.max(0, vv.offsetTop) : 0
    if (app) app.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : ''
    setKeyboard(open ? appHeight - vv.height : 0)
    if (!open) {
      if (window.scrollY) window.scrollTo(0, 0)
      fitHeight()
    }
  }
  const update = () => {
    if (!frame) frame = requestAnimationFrame(apply)
  }
  vv.addEventListener('resize', update)
  vv.addEventListener('scroll', update)
  // клавиатура закрылась — iOS иногда «забывает» вернуть окно; проверяем ещё раз чуть позже
  document.addEventListener('focusout', () => setTimeout(update, 350))
}

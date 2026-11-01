import { Keyboard } from '@capacitor/keyboard'
import { isNative } from './platform'

const root = document.documentElement
let appHeight = window.innerHeight
// самая большая высота окна без клавиатуры для текущей ширины (поворот сбрасывает)
let maxInner = window.innerHeight
let maxWidth = window.innerWidth
const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

/**
 * Высота приложения. iOS в режиме «На экран Домой» иногда отдаёт окно короче экрана
 * (особенно после того, как закрылась клавиатура) — снизу появлялась полоса и обрезалась панель.
 * Берём настоящую высоту экрана; html и body получают её же, чтобы ничего не обрезали.
 */
function fitHeight() {
  if (window.innerWidth !== maxWidth) {
    maxWidth = window.innerWidth
    maxInner = 0
  }
  if (!root.classList.contains('kb-open')) maxInner = Math.max(maxInner, window.innerHeight)
  const portrait = window.innerHeight >= window.innerWidth || maxInner >= window.innerWidth
  appHeight = standalone() && portrait ? Math.max(maxInner, screen.height) : maxInner
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
  window.addEventListener('resize', () => {
    if (!root.classList.contains('kb-open') || window.innerWidth !== maxWidth) fitHeight()
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
    // Высоту клавиатуры считаем от полной высоты приложения: в iOS 26 в режиме
    // «На экран Домой» вместе с клавиатурой уменьшается и window.innerHeight,
    // поэтому сравнивать с ним нельзя.
    const open = appHeight - vv.height > 120
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

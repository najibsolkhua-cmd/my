import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { isNative, setupNative } from './native'
import { setupNotifications } from './notify'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Офлайн-режим: сервис-воркер кэширует приложение после первого открытия.
setupNative()
setupNotifications()

if (!isNative && import.meta.env.PROD && 'serviceWorker' in navigator && location.protocol === 'https:' && import.meta.env.MODE !== 'single') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}

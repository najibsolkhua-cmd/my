import { Capacitor } from '@capacitor/core'

/** Запущено как установленное приложение (iOS/Android), а не в браузере. */
export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web'

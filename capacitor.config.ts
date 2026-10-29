import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.github.najibsolkhuacmd.kapital',
  appName: 'Капитал',
  webDir: 'dist',
  backgroundColor: '#071430',
  android: {
    backgroundColor: '#071430',
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      style: 'DARK',
      initialViewportFitValueHint: 'cover',
    },
  },
}

export default config

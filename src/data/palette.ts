export interface CardColor {
  key: string
  bg: string
  accent: string
  ink: string
}

// Яркие «карточные» цвета в духе референса со стопкой карт.
export const CARD_COLORS: CardColor[] = [
  { key: 'sand', bg: '#E6E1D3', accent: '#E2532F', ink: '#17171a' },
  { key: 'lemon', bg: '#ECEF6E', accent: '#F2AE3A', ink: '#17171a' },
  { key: 'mint', bg: '#8ED69C', accent: '#3C9C5B', ink: '#0f2216' },
  { key: 'periwinkle', bg: '#9EA9F3', accent: '#5662D8', ink: '#11142e' },
  { key: 'sky', bg: '#79BDF4', accent: '#1F5FB0', ink: '#0b1b30' },
  { key: 'teal', bg: '#39C6B6', accent: '#0F6E66', ink: '#062421' },
  { key: 'tomato', bg: '#EE4B3B', accent: '#FFB09F', ink: '#ffffff' },
  { key: 'orange', bg: '#F68B30', accent: '#FFD38E', ink: '#1d1206' },
  { key: 'pink', bg: '#E04AC6', accent: '#FFA6EC', ink: '#ffffff' },
  { key: 'violet', bg: '#9D5BEF', accent: '#D8B6FF', ink: '#ffffff' },
  { key: 'graphite', bg: '#5E6068', accent: '#A3A5AE', ink: '#ffffff' },
  { key: 'navy', bg: '#1E3A72', accent: '#6FA9FF', ink: '#ffffff' },
]

export function cardColor(key: string): CardColor {
  return CARD_COLORS.find((c) => c.key === key) ?? CARD_COLORS[0]
}

// Цвета для категорий расходов.
export const CATEGORY_COLORS = [
  '#F97316', '#EF4444', '#EC4899', '#A855F7', '#6366F1', '#3B82F6',
  '#0EA5E9', '#14B8A6', '#22C55E', '#84CC16', '#EAB308', '#78716C',
]

export const PATTERN_COUNT = 6

export interface CardColor {
  key: string
  name: string
  /** фон карты — цвет или градиент */
  bg: string
  /** сплошной цвет, близкий к фону: для графиков, подсветок, Live Activity */
  base: string
  /** второй цвет — узор */
  accent: string
  /** цвет текста на карте */
  ink: string
}

const solid = (key: string, name: string, bg: string, accent: string, ink: string): CardColor => ({ key, name, bg, base: bg, accent, ink })
const gradient = (key: string, name: string, from: string, to: string, base: string, accent: string, ink: string): CardColor => ({
  key,
  name,
  bg: `linear-gradient(135deg, ${from}, ${to})`,
  base,
  accent,
  ink,
})

// Двухцветные сочетания: фон + узор. Первые 12 ключей не меняем — они уже сохранены у пользователей.
export const CARD_COLORS: CardColor[] = [
  solid('sand', 'Песок и томат', '#E6E1D3', '#E2532F', '#17171a'),
  solid('lemon', 'Лимон и апельсин', '#ECEF6E', '#F2AE3A', '#17171a'),
  solid('mint', 'Мята', '#8ED69C', '#3C9C5B', '#0f2216'),
  solid('periwinkle', 'Барвинок', '#9EA9F3', '#5662D8', '#11142e'),
  solid('sky', 'Небо', '#79BDF4', '#1F5FB0', '#0b1b30'),
  solid('teal', 'Бирюза', '#39C6B6', '#0F6E66', '#062421'),
  solid('tomato', 'Томат', '#EE4B3B', '#FFB09F', '#ffffff'),
  solid('orange', 'Апельсин', '#F68B30', '#FFD38E', '#1d1206'),
  solid('pink', 'Фуксия', '#E04AC6', '#FFA6EC', '#ffffff'),
  solid('violet', 'Фиалка', '#9D5BEF', '#D8B6FF', '#ffffff'),
  solid('graphite', 'Графит', '#5E6068', '#A3A5AE', '#ffffff'),
  solid('navy', 'Ночь', '#1E3A72', '#6FA9FF', '#ffffff'),
  solid('gold-night', 'Чёрное золото', '#16181F', '#E8B64C', '#F5E6C4'),
  solid('coral-navy', 'Коралл и индиго', '#FF7A6B', '#1E2A5A', '#1E2A5A'),
  solid('mint-violet', 'Мята и фиолет', '#BDF2D5', '#7C4DFF', '#1B1340'),
  solid('peach-teal', 'Персик и бирюза', '#FFC9A8', '#0F8B8D', '#2A1A10'),
  solid('lilac-lime', 'Сирень и лайм', '#B9A5FF', '#D7FF5A', '#21124A'),
  solid('forest', 'Лес и сливки', '#1F4D3A', '#F3E9D2', '#F3E9D2'),
  solid('sky-sun', 'Небо и солнце', '#8CD3FF', '#FFD23F', '#0B2540'),
  solid('cherry', 'Вишня', '#B3123A', '#FF8FB1', '#ffffff'),
  solid('neon', 'Неон', '#22252B', '#39FF88', '#E8FFF1'),
  solid('olive', 'Олива', '#E9DCC0', '#6B7A2E', '#2A2614'),
  gradient('ocean', 'Океан', '#1FA2FF', '#A6FFCB', '#3FC3E6', '#0B4F8A', '#06223D'),
  gradient('sunset', 'Закат', '#FF5F6D', '#FFC371', '#FF8F6D', '#7A1E3A', '#2B0A14'),
  gradient('aurora', 'Северное сияние', '#7F5AF0', '#2CB67D', '#5688B6', '#E5FF7A', '#ffffff'),
  gradient('flamingo', 'Фламинго', '#F857A6', '#FF8A5C', '#FB6A86', '#FFE0EC', '#ffffff'),
  gradient('gold', 'Золото', '#F7D774', '#C8902E', '#E0B451', '#7A4E10', '#2A1A04'),
  gradient('ice', 'Лёд', '#E0EAFC', '#B9CDEB', '#D3E1F6', '#4A6FA5', '#14233C'),
]

export function cardColor(key: string): CardColor {
  return CARD_COLORS.find((c) => c.key === key) ?? CARD_COLORS[0]
}

/** Кружок выбора цвета: обе половинки — фон и узор. */
export function swatchBackground(c: CardColor): string {
  return `linear-gradient(135deg, transparent 50%, ${c.accent} 50%), ${c.bg}`
}

// Цвета для категорий расходов.
export const CATEGORY_COLORS = [
  '#F97316', '#EF4444', '#EC4899', '#A855F7', '#6366F1', '#3B82F6',
  '#0EA5E9', '#14B8A6', '#22C55E', '#84CC16', '#EAB308', '#78716C',
]

export const PATTERN_NAMES = [
  'Круги', 'Солнце', 'Полосы', 'Мишень', 'Точки', 'Волны', 'Рост', 'Шахматы', 'Горы',
  'Половинки', 'Радуга', 'Соты', 'Плюсы', 'Стрелки', 'Капля', 'Монеты', 'Орбиты', 'Конфетти',
]
export const PATTERN_COUNT = PATTERN_NAMES.length

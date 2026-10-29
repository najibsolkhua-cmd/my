const intFmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

/** Округление до копеек без артефактов плавающей точки. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** 1234567.5 → «1 234 568 ₽» */
export function money(n: number, withSign = false): string {
  const v = Math.round(n)
  const s = intFmt.format(Math.abs(v)).replace(/ /g, ' ')
  const sign = v < 0 ? '−' : withSign && v > 0 ? '+' : ''
  return `${sign}${s} ₽`
}

/** Делит сумму на целую часть и копейки — для крупного вывода. */
export function moneyParts(n: number): { int: string; frac: string; negative: boolean } {
  const negative = n < 0
  const abs = round2(Math.abs(n))
  const int = intFmt.format(Math.floor(abs)).replace(/ /g, ' ')
  const kop = Math.round((abs - Math.floor(abs)) * 100)
  return { int, frac: kop ? `,${String(kop).padStart(2, '0')}` : '', negative }
}

/** 186486 → «186k», 1500000 → «1,5M» */
export function compact(n: number): string {
  const a = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (a >= 1e6) return `${sign}${trim(a / 1e6)}M`
  if (a >= 1e3) return `${sign}${trim(a / 1e3)}k`
  return `${sign}${Math.round(a)}`
}

function trim(x: number): string {
  return (x >= 100 ? Math.round(x) : Math.round(x * 10) / 10).toString().replace('.', ',')
}

/** 330 → «5 ч 30 мин», 45 → «45 мин» */
export function duration(minutes: number): string {
  const m = Math.round(minutes)
  const h = Math.floor(m / 60)
  const r = m % 60
  if (!h) return `${r} мин`
  if (!r) return `${h} ч`
  return `${h} ч ${r} мин`
}

/** Короткий вариант: 330 → «5,5 ч» */
export function hoursShort(minutes: number): string {
  const h = minutes / 60
  const v = h >= 100 ? Math.round(h) : Math.round(h * 10) / 10
  return `${String(v).replace('.', ',')} ч`
}

/** Разбор суммы, введённой пользователем: «12 500,50» → 12500.5 */
export function parseAmount(input: string): number {
  const cleaned = input.replace(/[\s ₽]/g, '').replace(',', '.')
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === '' || cleaned === '.') return NaN
  return round2(parseFloat(cleaned))
}

/** Форматирование суммы во время ввода: «12500,5» → «12 500,5» */
export function formatAmountInput(input: string): string {
  let s = input.replace(/[^\d.,]/g, '').replace('.', ',')
  const firstComma = s.indexOf(',')
  if (firstComma !== -1) {
    s = s.slice(0, firstComma + 1) + s.slice(firstComma + 1).replace(/,/g, '').slice(0, 2)
  }
  const [int, frac] = s.split(',')
  const intClean = int.replace(/^0+(?=\d)/, '').slice(0, 12)
  const grouped = intClean.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return frac !== undefined ? `${grouped || '0'},${frac}` : grouped
}

/** Склонение: plural(5, ['запись','записи','записей']) */
export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}

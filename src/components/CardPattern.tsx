// Геометрические узоры для карт. Холст 340×214; левый верх и левый низ
// по возможности свободны — там название и сумма.
export function CardPattern({ pattern, color, bg }: { pattern: number; color: string; bg: string }) {
  return (
    <svg className="ccard-pattern" viewBox="0 0 340 214" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g fill={color} stroke={color}>{shapes(pattern, bg)}</g>
    </svg>
  )
}

const hex = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')

// Детерминированные «случайные» позиции для конфетти.
const CONFETTI = Array.from({ length: 22 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
  return { x: 150 + r(1) * 185, y: 10 + r(2) * 195, rot: r(3) * 180, kind: i % 3, s: 6 + r(4) * 8 }
})

function shapes(p: number, bg: string) {
  switch (p % 18) {
    case 0:
      return (
        <g stroke="none">
          <path d="M104 56 A68 68 0 0 0 104 192 Z" />
          <path d="M176 56 A68 68 0 0 0 176 192 Z" />
          <circle cx="262" cy="124" r="68" />
        </g>
      )
    case 1:
      return (
        <g stroke="none">
          <circle cx="292" cy="62" r="118" />
          <circle cx="132" cy="150" r="44" opacity="0.75" />
        </g>
      )
    case 2:
      return (
        <g strokeWidth="22" fill="none">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1={120 + i * 48} y1={230} x2={240 + i * 48} y2={-20} />
          ))}
        </g>
      )
    case 3:
      return (
        <g fill="none" strokeWidth="16">
          {[28, 62, 96, 130].map((r) => (
            <circle key={r} cx="300" cy="107" r={r} />
          ))}
        </g>
      )
    case 4:
      return (
        <g stroke="none">
          {Array.from({ length: 4 }, (_, row) =>
            Array.from({ length: 5 }, (_, col) => <circle key={`${row}-${col}`} cx={176 + col * 30} cy={62 + row * 28} r={7 + ((row + col) % 3) * 2.5} />),
          )}
        </g>
      )
    case 5:
      return (
        <g fill="none" strokeWidth="18" strokeLinecap="round">
          {[60, 104, 148].map((y) => (
            <path key={y} d={`M110 ${y} q 30 -34 60 0 t 60 0 t 60 0 t 60 0`} />
          ))}
        </g>
      )
    case 6: // столбики графика растут вправо
      return (
        <g stroke="none">
          {[40, 62, 54, 88, 110, 146].map((h, i) => (
            <rect key={i} x={172 + i * 28} y={214 - h - 30} width="18" height={h + 40} rx="7" />
          ))}
        </g>
      )
    case 7: // шахматка
      return (
        <g stroke="none">
          {Array.from({ length: 8 }, (_, row) =>
            Array.from({ length: 6 }, (_, col) => ((row + col) % 2 ? null : <rect key={`${row}-${col}`} x={184 + col * 26} y={row * 27} width="26" height="27" />)),
          )}
        </g>
      )
    case 8: // горы
      return (
        <g stroke="none">
          <polygon points="120,214 200,96 280,214" opacity="0.7" />
          <polygon points="190,214 280,60 370,214" />
          <polygon points="250,92 280,60 310,92 295,84 280,98 265,84" fill={bg} />
        </g>
      )
    case 9: // диагональная половинка
      return <polygon points="340,0 340,214 110,214" stroke="none" />
    case 10: // радуга-восход
      return (
        <g fill="none" strokeWidth="16">
          {[34, 66, 98, 130].map((r) => (
            <path key={r} d={`M${262 - r} 214 A${r} ${r} 0 0 1 ${262 + r} 214`} />
          ))}
        </g>
      )
    case 11: // соты
      return (
        <g fill="none" strokeWidth="5">
          {Array.from({ length: 4 }, (_, row) =>
            Array.from({ length: 4 }, (_, col) => <polygon key={`${row}-${col}`} points={hex(200 + col * 38 + (row % 2) * 19, 36 + row * 33, 20)} />),
          )}
        </g>
      )
    case 12: // плюсы
      return (
        <g strokeWidth="7" strokeLinecap="round">
          {Array.from({ length: 4 }, (_, row) =>
            Array.from({ length: 4 }, (_, col) => {
              const x = 196 + col * 36
              const y = 50 + row * 34
              return (
                <g key={`${row}-${col}`}>
                  <line x1={x - 9} y1={y} x2={x + 9} y2={y} />
                  <line x1={x} y1={y - 9} x2={x} y2={y + 9} />
                </g>
              )
            }),
          )}
        </g>
      )
    case 13: // стрелки вверх — рост
      return (
        <g fill="none" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round">
          {[0, 1, 2].map((i) => (
            <polyline key={i} points={`${200},${170 - i * 46} ${260},${120 - i * 46} ${320},${170 - i * 46}`} opacity={1 - i * 0.25} />
          ))}
        </g>
      )
    case 14: // капля
      return <path stroke="none" d="M250 18 C312 18 352 70 340 128 C330 182 280 214 226 206 C170 198 150 150 168 108 C184 70 196 18 250 18 Z" />
    case 15: // стопки монет
      return (
        <g strokeWidth="3" stroke={bg}>
          {[3, 6, 9, 5].map((n, s) =>
            Array.from({ length: n }, (_, i) => <ellipse key={`${s}-${i}`} cx={190 + s * 46} cy={188 - i * 12} rx="22" ry="8" fill={undefined} />),
          )}
        </g>
      )
    case 16: // орбиты
      return (
        <g fill="none" strokeWidth="9">
          <ellipse cx="270" cy="107" rx="110" ry="40" transform="rotate(-30 270 107)" />
          <ellipse cx="270" cy="107" rx="110" ry="40" transform="rotate(30 270 107)" />
          <circle cx="270" cy="107" r="22" stroke="none" />
        </g>
      )
    default: // конфетти
      return (
        <g stroke="none">
          {CONFETTI.map((c, i) =>
            c.kind === 0 ? (
              <circle key={i} cx={c.x} cy={c.y} r={c.s / 1.6} />
            ) : c.kind === 1 ? (
              <rect key={i} x={c.x} y={c.y} width={c.s * 1.8} height={c.s / 1.5} rx="2" transform={`rotate(${c.rot} ${c.x} ${c.y})`} />
            ) : (
              <polygon key={i} points={`${c.x},${c.y - c.s} ${c.x + c.s},${c.y + c.s} ${c.x - c.s},${c.y + c.s}`} transform={`rotate(${c.rot} ${c.x} ${c.y})`} />
            ),
          )}
        </g>
      )
  }
}

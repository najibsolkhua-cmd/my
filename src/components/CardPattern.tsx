// Геометрические узоры для карт — в духе референса с крупными кругами.
export function CardPattern({ pattern, color }: { pattern: number; color: string }) {
  return (
    <svg className="ccard-pattern" viewBox="0 0 340 214" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g fill={color} stroke={color}>{shapes(pattern)}</g>
    </svg>
  )
}

function shapes(p: number) {
  switch (p % 6) {
    case 0:
      return (
        <>
          <path d="M104 56 A68 68 0 0 0 104 192 Z" stroke="none" />
          <path d="M176 56 A68 68 0 0 0 176 192 Z" stroke="none" />
          <circle cx="262" cy="124" r="68" stroke="none" />
        </>
      )
    case 1:
      return (
        <>
          <circle cx="292" cy="62" r="118" stroke="none" />
          <circle cx="132" cy="150" r="44" stroke="none" opacity="0.75" />
        </>
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
    default:
      return (
        <g fill="none" strokeWidth="18" strokeLinecap="round">
          {[60, 104, 148].map((y) => (
            <path key={y} d={`M110 ${y} q 30 -34 60 0 t 60 0 t 60 0 t 60 0`} />
          ))}
        </g>
      )
  }
}

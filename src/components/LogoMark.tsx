/** Логотип — стопка карт, как на иконке приложения. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="96 92 320 340" aria-hidden className="logo-mark">
      <defs>
        <clipPath id="logo-front">
          <rect x="96" y="236" width="320" height="196" rx="30" />
        </clipPath>
      </defs>
      <rect x="136" y="92" width="240" height="150" rx="24" fill="#ECEF6E" />
      <rect x="118" y="140" width="276" height="160" rx="26" fill="#8ED69C" />
      <rect x="104" y="190" width="304" height="170" rx="28" fill="#9EA9F3" />
      <rect x="96" y="236" width="320" height="196" rx="30" fill="#E6E1D3" />
      <g clipPath="url(#logo-front)" fill="#E2532F">
        <path d="M186 268 A66 66 0 0 0 186 400 Z" />
        <path d="M256 268 A66 66 0 0 0 256 400 Z" />
        <circle cx="330" cy="334" r="66" />
      </g>
    </svg>
  )
}

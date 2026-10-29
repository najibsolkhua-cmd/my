export function Progress({ value, color, height = 8 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="progress" style={{ height }}>
      <div className="progress-fill" style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, background: color }} />
    </div>
  )
}

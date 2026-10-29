import { Sparkles } from 'lucide-react'
import { ICONS } from '../data/icons'

export function Icon({ name, size = 20, strokeWidth = 2, className }: { name: string; size?: number; strokeWidth?: number; className?: string }) {
  const C = ICONS[name] ?? Sparkles
  return <C size={size} strokeWidth={strokeWidth} className={className} aria-hidden />
}

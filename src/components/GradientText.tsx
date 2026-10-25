import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

/** Animated gradient headline text (React Bits "Gradient Text"). */
export function GradientText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('gradient-text', className)}>{children}</span>
}

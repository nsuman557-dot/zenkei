import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

/** Text with a sweeping shine (React Bits "Shiny Text"). */
export function ShinyText({
  children,
  className,
  speed = 3,
}: {
  children: ReactNode
  className?: string
  speed?: number
}) {
  return (
    <span
      className={cn('animate-shine-text inline-block bg-clip-text text-transparent', className)}
      style={{
        backgroundImage: 'linear-gradient(110deg, var(--muted) 35%, var(--foreground) 50%, var(--muted) 65%)',
        backgroundSize: '200% 100%',
        animationDuration: `${speed}s`,
      }}
    >
      {children}
    </span>
  )
}

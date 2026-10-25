import { useMemo } from 'react'
import { cn } from '../lib/utils'

/** Streaks falling across the parent (Magic UI "Meteors"). Pure CSS; positions are fixed per mount. Parent must be `relative overflow-hidden`. */
export function Meteors({ number = 18, className }: { number?: number; className?: string }) {
  const rows = useMemo(
    () =>
      Array.from({ length: number }, () => ({
        left: Math.floor(Math.random() * 100),
        delay: Math.random() * 6,
        dur: 3 + Math.random() * 5,
      })),
    [number],
  )
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {rows.map((m, i) => (
        <span
          key={i}
          className={cn('animate-meteor absolute -top-2 size-0.5 rotate-[215deg] rounded-full bg-foreground/60 shadow-[0_0_0_1px_rgba(128,128,128,0.08)]', className)}
          style={{ left: `${m.left}%`, animationDelay: `${m.delay}s`, ['--dur' as string]: `${m.dur}s` }}
        >
          <span className="absolute top-1/2 -z-10 h-px w-[60px] -translate-y-1/2 bg-gradient-to-r from-foreground/60 to-transparent" />
        </span>
      ))}
    </div>
  )
}

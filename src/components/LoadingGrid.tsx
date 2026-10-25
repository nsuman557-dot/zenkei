import { useEffect, useState } from 'react'
import { cn } from '../lib/utils'

/** 3×3 pulsing dot grid + live elapsed timer ("Loading 0.4s"). Colour follows `currentColor`. */
export function LoadingGrid({ label = 'Loading', className }: { label?: string; className?: string }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const i = setInterval(() => setT((performance.now() - start) / 1000), 100)
    return () => clearInterval(i)
  }, [])
  return (
    <div role="status" className={cn('inline-flex items-center gap-2 text-xs font-medium text-muted', className)}>
      <span aria-hidden className="grid grid-cols-3 gap-[2px]">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="zk-dot size-[5px] rounded-[1px] bg-current" style={{ animationDelay: `${((i % 3) + Math.floor(i / 3)) * 120}ms` }} />
        ))}
      </span>
      <span>{label}</span>
      <span className="tabular-nums opacity-60">{t.toFixed(1)}s</span>
    </div>
  )
}

import { useId } from 'react'
import { cn } from '../lib/utils'

/** Subtle dotted backdrop (Magic UI "Dot Pattern"). */
export function DotPattern({
  size = 22,
  radius = 1,
  className,
}: {
  size?: number
  radius?: number
  className?: string
}) {
  const id = useId()
  return (
    <svg
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 h-full w-full fill-foreground/15', className)}
    >
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <circle cx={radius} cy={radius} r={radius} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  )
}

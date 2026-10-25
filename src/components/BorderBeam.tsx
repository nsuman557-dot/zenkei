import type { CSSProperties } from 'react'

/** Light beam travelling around a border (Magic UI "Border Beam"). Parent must be `relative`. */
export function BorderBeam({
  size = 160,
  duration = 8,
  delay = 0,
  color = 'var(--accent)',
}: {
  size?: number
  duration?: number
  delay?: number
  color?: string
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
    >
      <div
        className="animate-border-beam absolute aspect-square"
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            background: `linear-gradient(to left, ${color}, transparent 60%)`,
            '--duration': `${duration}s`,
            animationDelay: `-${delay}s`,
          } as CSSProperties
        }
      />
    </div>
  )
}

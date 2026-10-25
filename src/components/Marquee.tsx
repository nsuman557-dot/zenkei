import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { cn } from '../lib/utils'

/** Infinite scrolling strip (Magic UI "Marquee"). */
export function Marquee({
  children,
  reverse = false,
  pauseOnHover = true,
  duration = 40,
  repeat = 2,
  className,
}: {
  children: ReactNode
  reverse?: boolean
  pauseOnHover?: boolean
  duration?: number
  repeat?: number
  className?: string
}) {
  // Pause the CSS animation while the strip is off screen, so it costs nothing until it is seen. No React state involved.
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-paused', !e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn('group flex gap-[var(--gap)] overflow-hidden [--gap:1rem]', className)}
      style={{ '--duration': `${duration}s` } as CSSProperties}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          aria-hidden={i > 0}
          className={cn(
            'animate-marquee flex shrink-0 items-center justify-around gap-[var(--gap)]',
            reverse && '[animation-direction:reverse]',
            'group-data-[paused]:[animation-play-state:paused]',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
          )}
        >
          {children}
        </div>
      ))}
    </div>
  )
}

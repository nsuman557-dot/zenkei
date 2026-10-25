import { useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/utils'

/** Card with a cursor-following glow (React Bits "Spotlight Card"). */
export function SpotlightCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
      }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className={cn('relative overflow-hidden rounded-2xl border border-border bg-card', className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: visible ? 1 : 0,
          background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, var(--glow), transparent 70%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  )
}

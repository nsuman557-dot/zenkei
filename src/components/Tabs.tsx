import { useEffect, useId, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

interface TabItem<T extends string> {
  id: T
  label: string
  count?: number
}

/** Segmented tabs with a sliding highlight. Scrolls horizontally on small screens. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: TabItem<T>[]
  value: T
  onChange: (id: T) => void
}) {
  const layoutId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef({ x: 0, left: 0, on: false, moved: false })
  // desktop: mouse wheel scrolls the strip sideways (native listener so preventDefault works)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const wheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [])
  return (
    <div
      ref={ref}
      role="tablist"
      className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      // desktop: click-and-drag to scroll; a drag never counts as a tab click
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse') drag.current = { x: e.clientX, left: ref.current!.scrollLeft, on: true, moved: false }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d.on) return
        if (Math.abs(e.clientX - d.x) > 5) d.moved = true
        if (d.moved) ref.current!.scrollLeft = d.left - (e.clientX - d.x)
      }}
      onPointerUp={() => (drag.current.on = false)}
      onPointerLeave={() => (drag.current.on = false)}
      onClickCapture={(e) => {
        if (drag.current.moved) {
          e.preventDefault()
          e.stopPropagation()
          drag.current.moved = false
        }
      }}
    >
      <div className="inline-flex gap-1 rounded-full border border-border bg-card/60 p-1 backdrop-blur">
        {tabs.map((tab) => {
          const active = tab.id === value
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors sm:px-5',
                active ? 'text-background' : 'text-muted hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-full bg-foreground"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 text-xs opacity-60">{tab.count}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

import { useRef, type ReactNode } from 'react'

/** Pulls its child towards the cursor on hover (React Bits "Magnet"). Mouse only — no-op on touch. */
export function Magnet({ children, strength = 4, padding = 60 }: { children: ReactNode; strength?: number; padding?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  function move(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    ref.current.style.transform = `translate3d(${dx / strength}px, ${dy / strength}px, 0)`
  }
  function leave() {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <div onPointerMove={move} onPointerLeave={leave} style={{ padding, margin: -padding }} className="inline-block">
      <div ref={ref} className="transition-transform duration-300 ease-out">
        {children}
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { cn } from '../lib/utils'

/**
 * Drifting dots that shy away from the cursor (React Bits "Particles"). Plain 2D canvas, capped DPR,
 * pauses off-screen / in background tabs and renders a single still frame for reduced-motion users.
 */
export function Particles({ count = 70, className }: { count?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let raf = 0
    let visible = true
    const mouse = { x: -9999, y: -9999 }
    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number }
    let ps: P[] = []

    const color = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e8294c'
    let rgb = color()

    function resize() {
      const r = canvas!.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas!.width = Math.round(w * dpr)
      canvas!.height = Math.round(h * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.round(count * Math.min(1, (w * h) / (1280 * 720)) + 18)
      ps = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -0.08 - Math.random() * 0.25,
        r: 0.7 + Math.random() * 1.9,
        a: 0.25 + Math.random() * 0.6,
      }))
    }

    function frame() {
      ctx!.clearRect(0, 0, w, h)
      ctx!.fillStyle = rgb
      for (const p of ps) {
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const d2 = dx * dx + dy * dy
        if (d2 < 140 * 140) {
          const d = Math.sqrt(d2) || 1
          const f = (1 - d / 140) * 1.6
          p.x += (dx / d) * f
          p.y += (dy / d) * f
        }
        p.x += p.vx
        p.y += p.vy
        if (p.y < -6) p.y = h + 6
        if (p.x < -6) p.x = w + 6
        if (p.x > w + 6) p.x = -6
        ctx!.globalAlpha = p.a
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(frame)
      else raf = 0
    }
    const start = () => {
      if (!raf && !reduce) raf = requestAnimationFrame(frame)
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return
      const r = canvas!.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
    }
    const onLeave = () => {
      mouse.x = mouse.y = -9999
    }
    const onVis = () => {
      rgb = color()
      start()
    }

    resize()
    frame()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) start()
    })
    io.observe(canvas)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', onVis)
    const mo = new MutationObserver(() => {
      rgb = color()
      if (reduce) frame()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-section'] })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [count])

  return <canvas ref={ref} aria-hidden className={cn('pointer-events-none absolute inset-0 h-full w-full', className)} />
}

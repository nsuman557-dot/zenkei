import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pointer } from 'lucide-react'
import './tour.css'

export interface TourStep {
  /** CSS selector of the element to highlight; steps whose element is missing are skipped */
  target: string
  title: string
  text: string
}

const key = (k: string) => `zk:tour:${k}`
export const tourSeen = (k: string) => {
  try {
    return localStorage.getItem(key(k)) === '1'
  } catch {
    return true // storage blocked: don't nag on every visit
  }
}
export const tourDone = (k: string) => {
  try {
    localStorage.setItem(key(k), '1')
  } catch {
    /* ignore */
  }
}

interface Box {
  x: number
  y: number
  w: number
  h: number
  rad: string
}

const PAD = 6

/**
 * Spotlight tutorial: dims everything except the target, points a finger at it, tap anywhere (or Next) to continue.
 * Pauses the video while open. `container` is where the overlay lives (the player root while fullscreen).
 */
export function Tour({
  steps,
  onDone,
  container = document.body,
  video,
  resume = true,
}: {
  steps: TourStep[]
  onDone: () => void
  container?: HTMLElement
  video?: () => HTMLVideoElement | null
  resume?: boolean
}) {
  const [list] = useState(() => steps.filter((s) => document.querySelector(s.target)))
  const [i, setI] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const [ch, setCh] = useState(0)
  const card = useRef<HTMLDivElement>(null)
  const nextBtn = useRef<HTMLButtonElement>(null)
  const last = i >= list.length - 1
  const act = useRef({ next: () => {}, prev: () => {}, skip: () => {} })
  act.current = { next: () => (last ? onDone() : setI(i + 1)), prev: () => setI(Math.max(0, i - 1)), skip: onDone }
  const body = container === document.body

  useEffect(() => {
    if (!list.length) onDone()
  }, [])

  // keep the video paused for the whole tour (autoplay may fire after it opens)
  useEffect(() => {
    const v = video?.()
    if (!v) return
    const pause = () => v.pause()
    pause()
    v.addEventListener('play', pause)
    return () => {
      v.removeEventListener('play', pause)
      if (resume) v.play().catch(() => {})
    }
  }, [])

  // keyboard: handled here, hidden from the player's own shortcuts
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      e.stopImmediatePropagation()
      if (e.key === 'Escape') act.current.skip()
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') act.current.next()
      else if (e.key === 'ArrowLeft') act.current.prev()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  }, [])

  // follow the target (scrolls, resizes, UI transitions) every frame while the step is shown
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(list[i]?.target ?? '')
    if (!el) return
    const q = el.getBoundingClientRect()
    if (q.top < 60 || q.bottom > innerHeight - 20) el.scrollIntoView({ block: 'center' })
    let raf = 0
    const tick = () => {
      const b = el.getBoundingClientRect()
      const o = body ? { left: 0, top: 0 } : container.getBoundingClientRect()
      const rad = getComputedStyle(el).borderRadius
      const n = { x: b.left - o.left - PAD, y: b.top - o.top - PAD, w: b.width + PAD * 2, h: b.height + PAD * 2, rad: !rad || rad === '0px' ? '12px' : rad }
      setBox((p) => (p && p.x === n.x && p.y === n.y && p.w === n.w && p.h === n.h && p.rad === n.rad ? p : n))
      raf = requestAnimationFrame(tick)
    }
    tick()
    nextBtn.current?.focus({ preventScroll: true })
    return () => cancelAnimationFrame(raf)
  }, [i, list, container, body])

  useLayoutEffect(() => {
    if (card.current) setCh(card.current.offsetHeight)
  }, [i, box?.w])

  const step = list[i]
  if (!step || !box) return null
  const W = body ? innerWidth : container.clientWidth
  const H = body ? innerHeight : container.clientHeight
  const cw = Math.min(300, W - 24)
  const below = H - (box.y + box.h)
  const under = below >= ch + 24 || below >= box.y
  const top = Math.min(Math.max(under ? box.y + box.h + 12 : box.y - 12 - ch, 8), Math.max(8, H - ch - 8))
  const left = Math.min(Math.max(box.x + box.w / 2 - cw / 2, 12), Math.max(12, W - cw - 12))
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2

  return createPortal(
    <div className={body ? 'tr tr-fixed' : 'tr'} onClick={() => act.current.next()} onPointerDown={(e) => e.stopPropagation()}>
      <div className="tr-hole" style={{ left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.rad }} />
      <span className="tr-tap" style={{ left: cx, top: cy }} aria-hidden />
      <Pointer className="tr-finger" style={{ left: cx - 15, top: cy - 4 }} aria-hidden />
      <div ref={card} className="tr-card" role="dialog" aria-modal="true" aria-live="polite" aria-label={step.title} style={{ left, top, width: cw }} onClick={(e) => e.stopPropagation()}>
        <p className="tr-n">
          Step {i + 1} of {list.length}
        </p>
        <h4>{step.title}</h4>
        <p className="tr-t">{step.text}</p>
        <div className="tr-f">
          <button type="button" className="tr-skip" onClick={() => act.current.skip()}>
            Skip tutorial
          </button>
          <span className="tr-dots" aria-hidden>
            {list.map((_, n) => (
              <i key={n} className={n === i ? 'on' : ''} />
            ))}
          </span>
          <button ref={nextBtn} type="button" className="tr-next" onClick={() => act.current.next()}>
            {last ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    container,
  )
}

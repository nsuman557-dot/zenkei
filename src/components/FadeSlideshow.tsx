import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { shuffle, type ShowcaseImage } from '../services/showcase'
import { cn } from '../lib/utils'

const FADE = 1.5 // seconds a new image takes to fade in over the old one

const load = (src: string) =>
  new Promise<boolean>((done) => {
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    img.onload = () => done(true)
    img.onerror = () => done(false)
    img.src = src
  })

/**
 * Fills its (relatively positioned) parent with artwork that changes by itself: a fresh random order on every page view,
 * each image preloaded before it is shown, cross-faded over the previous one (which stays solid underneath until the new
 * one is fully in, so there is never a dip to the background) with a slow zoom. Pauses in hidden tabs; honours reduced motion.
 */
export function FadeSlideshow({
  images,
  interval = 7000,
  delay = 0,
  preferWide = false,
  onChange,
  className,
  imgClassName,
}: {
  images: ShowcaseImage[]
  /** ms between images */
  interval?: number
  /** ms before the first image appears (stagger several slideshows) */
  delay?: number
  /** use the landscape banner when a title has one */
  preferWide?: boolean
  /** called with the image that just became visible */
  onChange?: (image: ShowcaseImage) => void
  className?: string
  imgClassName?: string
}) {
  const reduce = useReducedMotion()
  const order = useMemo(() => shuffle(images), [images])
  const [shown, setShown] = useState<{ n: number; src: string } | null>(null)
  const cursor = useRef(-1)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!order.length) return
    let dead = false
    let timer = 0
    const srcOf = (im: ShowcaseImage) => (preferWide && im.wide ? im.wide : im.src)

    async function advance() {
      for (let tries = 0; tries < order.length && !dead; tries++) {
        cursor.current = (cursor.current + 1) % order.length
        const im = order[cursor.current]
        const src = srcOf(im)
        if (await load(src)) {
          if (dead) return
          setShown({ n: cursor.current, src })
          onChangeRef.current?.(im)
          return
        }
      }
    }
    async function tick() {
      if (!document.hidden) await advance()
      if (!dead) timer = window.setTimeout(tick, interval)
    }
    timer = window.setTimeout(tick, delay)
    return () => {
      dead = true
      window.clearTimeout(timer)
    }
  }, [order, interval, delay, preferWide])

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <AnimatePresence initial={false}>
        {shown && (
          <motion.img
            key={`${shown.n}:${shown.src}`}
            src={shown.src}
            alt=""
            draggable={false}
            referrerPolicy="no-referrer"
            initial={{ opacity: 0, scale: reduce ? 1 : 1.12 }}
            animate={{ opacity: 1, scale: 1, transition: { opacity: { duration: FADE, ease: 'easeInOut' }, scale: { duration: interval / 1000 + FADE + 1, ease: 'linear' } } }}
            exit={{ opacity: 0, transition: { duration: 0.05, delay: FADE } }}
            className={cn('absolute inset-0 size-full object-cover object-[50%_22%]', imgClassName)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

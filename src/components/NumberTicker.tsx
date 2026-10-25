import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

/** Counts up to a value once in view (Magic UI "Number Ticker"). */
export function NumberTicker({
  value,
  decimals = 0,
  delay = 0,
  className,
}: {
  value: number
  decimals?: number
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { damping: 60, stiffness: 90 })
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const t = window.setTimeout(() => motionValue.set(value), delay * 1000)
    return () => window.clearTimeout(t)
  }, [inView, value, delay, motionValue])

  useEffect(
    () =>
      spring.on('change', (latest) => {
        if (ref.current) {
          ref.current.textContent = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(latest)
        }
      }),
    [spring, decimals],
  )

  return (
    <span ref={ref} className={className}>
      {(0).toFixed(decimals)}
    </span>
  )
}

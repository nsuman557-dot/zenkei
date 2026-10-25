import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../lib/utils'

/** Cycles through words with a slide + blur swap (React Bits "Rotating Text"). */
export function RotatingText({ words, interval = 2400, className, itemClassName }: { words: string[]; interval?: number; className?: string; itemClassName?: string }) {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (words.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setI((n) => (n + 1) % words.length), interval)
    return () => window.clearInterval(id)
  }, [words.length, interval])

  return (
    <span className={cn('relative inline-grid overflow-hidden align-bottom', className)} aria-live="off">
      {/* invisible copies reserve the width of the longest word so the layout never jumps */}
      {words.map((w) => (
        <span key={w} aria-hidden className="invisible col-start-1 row-start-1">
          {w}
        </span>
      ))}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[i]}
          className={cn('col-start-1 row-start-1', itemClassName)}
          initial={{ y: '110%', opacity: 0, filter: 'blur(8px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-110%', opacity: 0, filter: 'blur(8px)' }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

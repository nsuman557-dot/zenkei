import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

/** Word-by-word blur-in headline (React Bits "Blur Text"). */
export function BlurText({
  text,
  className,
  stagger = 0.07,
  delay = 0,
}: {
  text: string
  className?: string
  stagger?: number
  delay?: number
}) {
  const words = text.split(' ')
  return (
    <h1 className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          aria-hidden
          className={cn('mr-[0.26em] inline-block will-change-[filter,opacity,transform]')}
          initial={{ filter: 'blur(12px)', opacity: 0, y: -16 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: delay + i * stagger, ease: 'easeOut' }}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  )
}

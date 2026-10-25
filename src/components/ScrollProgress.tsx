import { motion, useScroll } from 'framer-motion'

/** Reading progress bar pinned to the top (Magic UI "Scroll Progress"). Bound straight to the scroll value: no spring, no re-render. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  return <motion.div aria-hidden style={{ scaleX: scrollYProgress }} className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-accent will-change-transform" />
}

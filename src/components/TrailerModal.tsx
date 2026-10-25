import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { AniTrailer } from '../types/anime'

function embedUrl(t: AniTrailer): string | null {
  if (!t.id) return null
  if (t.site === 'youtube') return `https://www.youtube-nocookie.com/embed/${t.id}?autoplay=1&rel=0`
  if (t.site === 'dailymotion') return `https://www.dailymotion.com/embed/video/${t.id}?autoplay=1`
  return null
}

export function TrailerModal({ trailer, onClose }: { trailer: AniTrailer | null; onClose: () => void }) {
  useEffect(() => {
    if (!trailer) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [trailer, onClose])

  const src = trailer ? embedUrl(trailer) : null

  return (
    <AnimatePresence>
      {trailer && src && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Trailer"
        >
          <motion.div
            className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl"
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={src}
              title="Anime trailer"
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close trailer"
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

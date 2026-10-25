import { motion } from 'framer-motion'
import { frameById, frameUrl } from '../lib/frames'
import { cn } from '../lib/utils'

/**
 * Round avatar with an optional animated frame. The frame is a plain <img> of an APNG on top of the avatar:
 * browsers animate that natively (canvas / background tricks or re-encoding would freeze it). It is 1.2x the
 * avatar and centred, as the frames are designed, so the parent must not clip overflow.
 */
export function Avatar({ size, src, frame, name, className, animateFrame }: { size: number; src?: string | null; frame?: string | null; name?: string; className?: string; animateFrame?: boolean }) {
  const f = frameById(frame)
  return (
    <span className={cn('relative inline-block shrink-0 align-middle', className)} style={{ width: size, height: size }}>
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-card-2 font-display font-bold text-muted ring-1 ring-border" style={{ fontSize: size * 0.42 }}>
        {src ? <img src={src} alt="" referrerPolicy="no-referrer" draggable={false} className="size-full object-cover" /> : (name?.trim()[0] ?? '?').toUpperCase()}
      </span>
      {f &&
        (animateFrame ? (
          <motion.img
            key={f.id}
            src={frameUrl(f)}
            alt=""
            aria-hidden
            draggable={false}
            initial={{ opacity: 0, scale: 0.6, rotate: -18 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 15 }}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
            style={{ width: size * 1.2, height: size * 1.2, x: '-50%', y: '-50%' }}
          />
        ) : (
          <img
            src={frameUrl(f)}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
            style={{ width: size * 1.2, height: size * 1.2, transform: 'translate(-50%, -50%)' }}
          />
        ))}
    </span>
  )
}

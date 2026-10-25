import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../lib/utils'

export type PhoneScreen = 'anime' | 'manga' | 'novels'
const NAV: PhoneScreen[] = ['anime', 'manga', 'novels']

/** CSS-only Android phone showing a stylised Zenkai screen. Posters are real artwork when we have it, soft tiles when we do not. */
export function PhoneMockup({ posters = [], screen = 'anime', className }: { posters?: string[]; screen?: PhoneScreen; className?: string }) {
  const img = (i: number, cls = '') => (posters[i] ? <img src={posters[i]} alt="" loading="lazy" className={cn('h-full w-full object-cover', cls)} /> : null)

  const screens: Record<PhoneScreen, ReactNode> = {
    anime: (
      <>
        <div className="relative h-[46%] bg-zinc-800">
          {posters[0] && <img src={posters[0]} alt="" className="h-full w-full scale-110 object-cover object-top" />}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-black/30" />
          <div className="absolute inset-x-3 bottom-2 space-y-1.5">
            <div className="h-2.5 w-24 rounded-full bg-white/90" />
            <div className="h-1.5 w-32 rounded-full bg-white/40" />
            <div className="flex gap-1.5 pt-1">
              <span className="rounded-full bg-white px-3 py-1 text-[9px] font-bold text-black">Watch now</span>
              <span className="rounded-full bg-white/15 px-2 py-1 text-[9px] backdrop-blur">+</span>
            </div>
          </div>
        </div>
        <div className="mt-3 px-3">
          <div className="mb-1.5 h-2 w-20 rounded-full bg-white/70" />
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[2/3] overflow-hidden rounded-lg bg-white/10">
                {img(i)}
              </div>
            ))}
          </div>
          <div className="mb-1.5 mt-3 h-2 w-14 rounded-full bg-white/50" />
          <div className="grid grid-cols-3 gap-1.5">
            {[4, 5, 6].map((i) => (
              <div key={i} className="aspect-[2/3] overflow-hidden rounded-lg bg-white/10">
                {img(i)}
              </div>
            ))}
          </div>
        </div>
      </>
    ),
    manga: (
      <div className="flex h-full flex-col bg-zinc-100 pb-11 pt-7 text-zinc-900">
        <div className="mx-2 mb-1.5 flex items-center justify-between">
          <span className="h-1.5 w-12 rounded-full bg-zinc-400" />
          <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[8px] font-bold text-white">RTL</span>
        </div>
        <div className="mx-2 grid min-h-0 flex-1 grid-cols-2 grid-rows-[1fr_1.3fr_1fr] gap-1.5">
          <div className="col-span-2 overflow-hidden rounded-sm bg-zinc-300">{img(1, 'grayscale contrast-125')}</div>
          <div className="overflow-hidden rounded-sm bg-zinc-300">{img(2, 'grayscale contrast-125')}</div>
          <div className="overflow-hidden rounded-sm bg-zinc-300">{img(3, 'grayscale contrast-125')}</div>
          <div className="col-span-2 overflow-hidden rounded-sm bg-zinc-300">{img(4, 'grayscale contrast-125')}</div>
        </div>
        <div className="mx-3 mt-2 flex items-center gap-2 text-[8px] font-semibold text-zinc-500">
          <span>12 / 38</span>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-300">
            <span className="block h-full w-1/3 rounded-full bg-zinc-900" />
          </span>
        </div>
      </div>
    ),
    novels: (
      <div className="h-full space-y-2 bg-zinc-950 px-4 pt-9">
        <div className="h-1.5 w-14 rounded-full bg-white/30" />
        <div className="h-3 w-32 rounded-full bg-white/85" />
        <div className="space-y-1.5 pt-2">
          {[100, 94, 98, 70, 100, 92, 96, 60, 100, 88, 97, 74, 100, 93, 80].map((w, i) => (
            <div key={i} className={cn('h-1.5 rounded-full bg-white/20', i === 4 || i === 8 ? 'mt-3' : '')} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    ),
  }

  return (
    <div aria-hidden className={cn('relative mx-auto aspect-[9/18.5] w-[230px] rounded-[2.5rem] border-[7px] border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 ring-1 ring-white/15', className)}>
      <div className="absolute left-1/2 top-2.5 z-20 size-2.5 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />
      <div className="absolute inset-0 overflow-hidden rounded-[1.9rem] text-white">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={screen} className="absolute inset-0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
            {screens[screen]}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-0 z-10 flex h-11 items-center justify-around border-t border-white/10 bg-black/80 backdrop-blur">
          {[...NAV, 'library'].map((k) => (
            <span key={k} className={cn('size-4 rounded-md transition-colors duration-300', k === screen ? 'bg-white' : 'bg-white/25')} />
          ))}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Radio } from 'lucide-react'
import { SpotlightCard } from './SpotlightCard'

/** Live countdown to the next episode. `airingAt` is a UNIX timestamp in seconds. */
export function Countdown({ airingAt, episode }: { airingAt: number; episode: number }) {
  const [now, setNow] = useState(() => Date.now() / 1000)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now() / 1000), 1000)
    return () => window.clearInterval(id)
  }, [])

  const diff = Math.max(0, Math.floor(airingAt - now))
  const parts = [
    { v: Math.floor(diff / 86400), l: 'days' },
    { v: Math.floor((diff % 86400) / 3600), l: 'hrs' },
    { v: Math.floor((diff % 3600) / 60), l: 'min' },
    { v: diff % 60, l: 'sec' },
  ]

  return (
    <SpotlightCard className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="relative grid size-10 place-items-center rounded-full bg-accent/15 text-accent">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
            <Radio className="relative size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Next episode</p>
            <p className="font-display text-lg font-bold">Episode {episode}</p>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3">
          {parts.map((p) => (
            <div key={p.l} className="min-w-[3.4rem] rounded-xl bg-card-2 px-2 py-2 text-center">
              <p className="font-display text-xl font-bold tabular-nums">{String(p.v).padStart(2, '0')}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted">{p.l}</p>
            </div>
          ))}
        </div>
      </div>
    </SpotlightCard>
  )
}

import { motion } from 'framer-motion'
import type { JikanStats } from '../types/anime'
import { compact } from '../lib/utils'

/** MyAnimeList score distribution (1–10) as animated bars. */
export function ScoreChart({ scores }: { scores: JikanStats['scores'] }) {
  const sorted = [...scores].sort((a, b) => a.score - b.score)
  const max = Math.max(...sorted.map((s) => s.percentage), 1)

  return (
    <div>
      <div className="flex h-44 items-end gap-1.5 sm:gap-2.5" role="img" aria-label="Score distribution">
        {sorted.map((s, i) => (
          <div key={s.score} className="group flex h-full flex-1 flex-col justify-end" title={`${compact(s.votes)} votes`}>
            <span className="mb-1 text-center text-[10px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
              {s.percentage.toFixed(1)}%
            </span>
            <motion.div
              className="w-full rounded-t-lg bg-foreground/80 transition-colors group-hover:bg-accent"
              initial={{ height: 0 }}
              whileInView={{ height: `${Math.max((s.percentage / max) * 100, 2)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2.5">
        {sorted.map((s) => (
          <span key={s.score} className="flex-1 text-center text-xs font-medium text-muted">
            {s.score}
          </span>
        ))}
      </div>
    </div>
  )
}

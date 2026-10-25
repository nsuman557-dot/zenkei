import { motion } from 'framer-motion'
import type { JikanStats } from '../types/anime'
import { compact } from '../lib/utils'

const SEGMENTS: { key: keyof Pick<JikanStats, 'completed' | 'watching' | 'plan_to_watch' | 'on_hold' | 'dropped'>; label: string; color: string }[] = [
  { key: 'completed', label: 'Completed', color: 'var(--accent)' },
  { key: 'watching', label: 'Watching', color: 'color-mix(in srgb, var(--foreground) 85%, transparent)' },
  { key: 'plan_to_watch', label: 'Plan to watch', color: 'color-mix(in srgb, var(--foreground) 55%, transparent)' },
  { key: 'on_hold', label: 'On hold', color: 'color-mix(in srgb, var(--foreground) 32%, transparent)' },
  { key: 'dropped', label: 'Dropped', color: 'color-mix(in srgb, var(--foreground) 16%, transparent)' },
]

/** Stacked bar showing how MAL members list this title. */
export function StatusBreakdown({ stats }: { stats: JikanStats }) {
  const total = SEGMENTS.reduce((sum, s) => sum + (stats[s.key] || 0), 0) || 1

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-card-2">
        {SEGMENTS.map((s, i) => (
          <motion.div
            key={s.key}
            style={{ background: s.color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${((stats[s.key] || 0) / total) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: i * 0.1, ease: 'easeOut' }}
          />
        ))}
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {SEGMENTS.map((s) => (
          <li key={s.key} className="flex items-center gap-2.5 text-sm">
            <span className="size-3 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="text-muted">{s.label}</span>
            <span className="ml-auto font-medium tabular-nums">{compact(stats[s.key])}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

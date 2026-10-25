import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

const PAGE = 50

/** Episode picker: range tabs for long series, current episode highlighted, unaired episodes disabled. */
export function EpisodeGrid({
  total,
  available,
  current,
  hrefFor,
}: {
  total: number
  /** highest episode that has aired */
  available: number
  current?: number
  hrefFor: (ep: number) => string
}) {
  const pages = Math.ceil(total / PAGE)
  const [page, setPage] = useState(() => Math.max(0, Math.floor(((current ?? 1) - 1) / PAGE)))
  useEffect(() => {
    if (current) setPage(Math.floor((current - 1) / PAGE))
  }, [current])

  const from = page * PAGE + 1
  const to = Math.min(total, from + PAGE - 1)

  return (
    <div>
      {pages > 1 && (
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95',
                i === page ? 'border-transparent bg-foreground text-background' : 'border-border bg-card/60 text-muted hover:text-foreground',
              )}
            >
              {i * PAGE + 1}–{Math.min(total, (i + 1) * PAGE)}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(54px,1fr))] gap-2">
        {Array.from({ length: to - from + 1 }, (_, i) => from + i).map((n) => {
          const aired = n <= available
          const on = n === current
          const cls = cn(
            'grid h-11 place-items-center rounded-xl border text-sm font-semibold tabular-nums transition',
            on ? 'border-transparent bg-accent text-accent-fg shadow-lg shadow-accent/30' : 'border-border bg-card/60',
            aired && !on && 'hover:bg-foreground hover:text-background active:scale-95',
            !aired && 'cursor-not-allowed opacity-35',
          )
          return aired ? (
            <Link key={n} to={hrefFor(n)} className={cls} aria-current={on ? 'true' : undefined}>
              {n}
            </Link>
          ) : (
            <span key={n} className={cls} title="Not aired yet">
              {n}
            </span>
          )
        })}
      </div>
    </div>
  )
}

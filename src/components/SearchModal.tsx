import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownLeft, Search, SearchX, Star, X } from 'lucide-react'
import { GENRES } from '../lib/constants'
import { useSearch } from '../context/SearchContext'
import { searchAnime } from '../services/anilist'
import type { AniMedia } from '../types/anime'
import { cn, formatLabel, pickTitle, toScore10 } from '../lib/utils'
import { Skeleton } from './Skeleton'

/** Command-palette style search (Ctrl/⌘ + K or "/"), with genre filtering. */
export function SearchModal() {
  const { isOpen, seed, closeSearch } = useSearch()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const requestId = useRef(0)

  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState<string | undefined>()
  const [results, setResults] = useState<AniMedia[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    setQuery(seed.query ?? '')
    setGenre(seed.genre)
    setActive(0)
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(t)
      document.body.style.overflow = prev
    }
  }, [isOpen, seed])

  useEffect(() => {
    if (!isOpen) return
    const q = query.trim()
    if (!q && !genre) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    const id = ++requestId.current
    const t = window.setTimeout(() => {
      searchAnime(q, genre)
        .then((r) => {
          if (id !== requestId.current) return
          setResults(r)
          setError(null)
          setActive(0)
        })
        .catch((e: unknown) => {
          if (id === requestId.current) setError(e instanceof Error ? e.message : 'Search failed')
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false)
        })
    }, 350)
    return () => window.clearTimeout(t)
  }, [query, genre, isOpen])

  function go(item: AniMedia) {
    closeSearch()
    navigate(`/anime/${item.id}`)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') closeSearch()
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && results[active]) go(results[active])
  }

  const idle = !query.trim() && !genre

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/60 px-3 pt-[8svh] backdrop-blur-sm sm:pt-[12svh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSearch}
          onKeyDown={onKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Search anime"
        >
          <motion.div
            className="flex max-h-[80svh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            initial={{ opacity: 0, y: -24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <Search className="size-5 shrink-0 text-muted" />
              {genre && (
                <button
                  type="button"
                  onClick={() => setGenre(undefined)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background"
                >
                  {genre} <X className="size-3" />
                </button>
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anime by title…"
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
                aria-label="Search anime"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground/10 transition hover:bg-foreground/20"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="no-scrollbar overflow-y-auto p-2">
              {idle && (
                <div className="p-3">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">Browse by genre</p>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((g) => (
                      <button
                        key={g.name}
                        type="button"
                        onClick={() => setGenre(g.name)}
                        className="rounded-full border border-border px-3.5 py-1.5 text-sm transition hover:bg-foreground hover:text-background"
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!idle && loading && (
                <ul className="space-y-1 p-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="flex gap-3 p-2">
                      <Skeleton className="h-16 w-11 shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {!idle && !loading && error && <p className="p-6 text-center text-sm text-muted">{error}</p>}

              {!idle && !loading && !error && results.length === 0 && (
                <div className="flex flex-col items-center gap-2 p-10 text-center text-muted">
                  <SearchX className="size-8" />
                  <p className="text-sm">No anime found. Try a different title.</p>
                </div>
              )}

              {!loading && !error && results.length > 0 && (
                <ul role="listbox">
                  {results.map((r, i) => (
                    <li key={r.id} role="option" aria-selected={i === active}>
                      <button
                        type="button"
                        onClick={() => go(r)}
                        onMouseEnter={() => setActive(i)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors',
                          i === active ? 'bg-foreground/10' : 'hover:bg-foreground/5',
                        )}
                      >
                        <img
                          src={r.coverImage.large ?? ''}
                          alt=""
                          loading="lazy"
                          className="h-16 w-11 shrink-0 rounded-lg object-cover"
                          style={{ backgroundColor: r.coverImage.color ?? undefined }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{pickTitle(r.title)}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {[formatLabel(r.format), r.seasonYear, r.genres.slice(0, 2).join(', ')]
                              .filter((v) => v && v !== '—')
                              .join(' · ')}
                          </span>
                        </span>
                        {r.averageScore ? (
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold">
                            <Star className="size-3.5 fill-current" />
                            {toScore10(r.averageScore)}
                          </span>
                        ) : null}
                        {i === active && <CornerDownLeft className="hidden size-4 shrink-0 text-muted sm:block" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

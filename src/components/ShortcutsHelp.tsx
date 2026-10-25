import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { isTyping, SHORTCUT_GROUPS, SHORTCUTS_EVENT, setTvMode, useTvMode } from '../lib/keys'

const Key = ({ children }: { children: string }) =>
  /^[–]$/.test(children) ? (
    <span className="text-muted">{children}</span>
  ) : (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-md border border-border bg-card-2 px-1.5 py-0.5 font-mono text-[0.72rem] font-semibold shadow-[0_1px_0_var(--border)]">{children}</kbd>
  )

/** Press ? anywhere (or use the footer link) to list every keyboard and remote shortcut. */
export function ShortcutsHelp() {
  const [open, setOpen] = useState(false)
  const tv = useTvMode()

  useEffect(() => {
    const toggle = () => setOpen((o) => !o)
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return
      if (e.key === '?') {
        e.preventDefault()
        toggle()
      } else if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener(SHORTCUTS_EVENT, toggle)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener(SHORTCUTS_EVENT, toggle)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={(e) => e.stopPropagation()} className="flex max-h-[88svh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-xl font-bold">Keyboard shortcuts</h2>
          <button autoFocus type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full transition hover:bg-foreground/10">
            <X className="size-5" />
          </button>
        </div>
        <div className="grid gap-x-10 gap-y-7 overflow-y-auto px-6 py-6 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((g) => (
            <section key={g.title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">{g.title}</h3>
              <ul className="space-y-2">
                {g.rows.map(([keys, what]) => (
                  <li key={what + keys.join()} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-muted">{what}</span>
                    <span className="flex shrink-0 flex-wrap justify-end gap-1">
                      {keys.map((k, i) => (
                        <Key key={k + i}>{k}</Key>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-border px-6 py-4 text-sm">
          <span>
            <b className="font-semibold">TV mode</b>
            <span className="block text-muted">Bigger interface and D-pad navigation. Turns on by itself on smart TVs; switch it on for a TV box or a browser on a TV.</span>
          </span>
          <input type="checkbox" checked={tv} onChange={(e) => setTvMode(e.target.checked)} className="size-5 shrink-0 accent-[var(--accent)]" />
        </label>
      </div>
    </div>,
    document.body,
  )
}

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { smartBackDelta } from './backToDetails'
import { isArrowKey, isBackKey, isTvMode } from './keys'
import { isDetailsPath, isReaderPath } from './sections'

/**
 * TV / D-pad support. In TV mode the arrow keys move focus to the nearest button or link in that direction,
 * OK/Enter presses it and Back closes the open menu, then steps back. It stays out of the way of text fields,
 * sliders, the video player (which has its own key map) and the readers (arrows turn pages there).
 */

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[role="button"]:not([aria-disabled="true"])'

type Dir = 'up' | 'down' | 'left' | 'right'
const DIRS: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }

function shown(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect()
  if (r.width < 4 || r.height < 4) return false
  if (el.closest('[aria-hidden="true"],[inert]')) return false
  const s = getComputedStyle(el)
  return s.visibility !== 'hidden' && s.display !== 'none'
}

const overlap = (a1: number, a2: number, b1: number, b2: number) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1))

/** The topmost open menu/dialog, or null for the page itself. */
function activeScope(): HTMLElement | null {
  const open = [...document.querySelectorAll<HTMLElement>('.zp-sw,[role="dialog"],[data-nav-scope]')].filter(shown)
  return open[open.length - 1] ?? null
}

function pick(from: HTMLElement | null, dir: Dir, scope: ParentNode): HTMLElement | null {
  const all = [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el !== from && shown(el))
  if (!all.length) return null
  if (!from) {
    // nothing focused yet: start with whatever is highest on screen
    const vh = innerHeight
    const inView = all.filter((el) => {
      const r = el.getBoundingClientRect()
      return r.bottom > 0 && r.top < vh
    })
    return (inView.length ? inView : all).sort((a, b) => {
      const A = a.getBoundingClientRect()
      const B = b.getBoundingClientRect()
      return A.top - B.top || A.left - B.left
    })[0]
  }
  const a = from.getBoundingClientRect()
  const ac = { x: a.left + a.width / 2, y: a.top + a.height / 2 }
  const horiz = dir === 'left' || dir === 'right'
  let best: HTMLElement | null = null
  let bestScore = Infinity
  for (const el of all) {
    const b = el.getBoundingClientRect()
    const dx = b.left + b.width / 2 - ac.x
    const dy = b.top + b.height / 2 - ac.y
    if (dir === 'right' ? dx <= 1 : dir === 'left' ? dx >= -1 : dir === 'down' ? dy <= 1 : dy >= -1) continue
    const gap = Math.max(0, dir === 'right' ? b.left - a.right : dir === 'left' ? a.left - b.right : dir === 'down' ? b.top - a.bottom : a.top - b.bottom)
    const side = Math.abs(horiz ? dy : dx)
    const shared = horiz ? overlap(a.top, a.bottom, b.top, b.bottom) : overlap(a.left, a.right, b.left, b.right)
    const score = gap + side * 2 - shared * 0.5
    if (score < bestScore) {
      bestScore = score
      best = el
    }
  }
  return best
}

export function useSpatialNav() {
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement
      const path = location.pathname

      /* ---- Back ---- */
      const tvBackspace = e.key === 'Backspace' && isTvMode() && !/^(INPUT|TEXTAREA)$/.test(t.tagName) && !t.isContentEditable
      if (isBackKey(e) || tvBackspace) {
        if (path === '/') return
        e.preventDefault()
        const scope = activeScope()
        if (scope) {
          if (scope.classList.contains('zp-sw')) scope.click() // player sheet closes on backdrop click
          else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
          return
        }
        const d = isDetailsPath(path) ? smartBackDelta(path) : null
        if (d !== null) navigate(d)
        else if (window.history.state?.idx > 0) navigate(-1)
        return
      }

      if (!isTvMode()) return

      /* ---- OK on a non-native button ---- */
      if (e.key === 'Enter' && t.getAttribute?.('role') === 'button' && !/^(BUTTON|A)$/.test(t.tagName)) {
        e.preventDefault()
        t.click()
        return
      }

      /* ---- D-pad ---- */
      if (!isArrowKey(e.key)) return
      const dir = DIRS[e.key]
      const horiz = dir === 'left' || dir === 'right'
      if (/^(TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return
      if (t.tagName === 'INPUT') {
        const type = (t as HTMLInputElement).type
        if (type !== 'range' || horiz) return // text fields keep their caret, sliders keep left/right
      }

      const scope = activeScope()
      const player = document.querySelector<HTMLElement>('[data-zk-player]')
      if (!scope && player && (player.contains(t) || t === document.body) && /^\/watch\//.test(path)) return // the player has its own key map
      if (!scope && isReaderPath(path)) return // arrows turn pages
      if (t.closest('[data-keys-own]')) return

      const from = t !== document.body && t !== document.documentElement && (scope ?? document).contains(t) && t.matches(FOCUSABLE) ? t : null
      const next = pick(from, dir, scope ?? document)
      if (!next) return
      e.preventDefault()
      next.focus({ preventScroll: true })
      next.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])
}

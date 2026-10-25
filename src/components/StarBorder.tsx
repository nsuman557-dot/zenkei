import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

/** Button with a travelling "star" along its border (React Bits "Star Border"). Renders a Link when `to` is set. */
export function StarBorder({
  children,
  to,
  onClick,
  color = 'color-mix(in srgb, var(--accent) 70%, white)',
  speed = '5s',
  className,
}: {
  children: ReactNode
  to?: string
  onClick?: () => void
  color?: string
  speed?: string
  className?: string
}) {
  const classes = cn(
    'group relative inline-block overflow-hidden rounded-full p-px transition-transform duration-200 hover:scale-[1.04] active:scale-95',
    className,
  )
  const inner = (
    <>
      <span
        aria-hidden
        className="animate-star-bottom absolute -bottom-3 -right-[250%] z-0 h-1/2 w-[300%] rounded-full opacity-80"
        style={{ background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed }}
      />
      <span
        aria-hidden
        className="animate-star-top absolute -top-3 -left-[250%] z-0 h-1/2 w-[300%] rounded-full opacity-80"
        style={{ background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[color-mix(in_srgb,var(--accent)_24%,#0a0a0c)] to-[#0a0a0c] px-7 py-3.5 text-sm font-bold text-white">
        {children}
      </span>
    </>
  )
  return to ? (
    <Link to={to} className={classes}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={classes}>
      {inner}
    </button>
  )
}

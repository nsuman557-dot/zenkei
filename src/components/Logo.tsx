import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LOGO_URL } from '../lib/constants'
import { cn } from '../lib/utils'

export function Logo({ size = 36, showText = true, className, to = '/home' }: { size?: number; showText?: boolean; className?: string; to?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <Link to={to} aria-label="Zenkai home" className={cn('group inline-flex items-center gap-2.5', className)}>
      {failed ? (
        <span
          className="grid place-items-center rounded-xl bg-foreground font-display text-lg font-black text-background"
          style={{ width: size, height: size }}
        >
          Z
        </span>
      ) : (
        <img
          src={LOGO_URL}
          alt="Zenkai logo"
          width={size}
          height={size}
          onError={() => setFailed(true)}
          className="rounded-xl object-cover ring-1 ring-border transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105"
          style={{ width: size, height: size }}
        />
      )}
      {showText && <span className="font-display text-xl font-extrabold tracking-tight">Zenkai</span>}
    </Link>
  )
}

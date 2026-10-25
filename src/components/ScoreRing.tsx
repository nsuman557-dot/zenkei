import { motion } from 'framer-motion'
import { NumberTicker } from './NumberTicker'
import { Skeleton } from './Skeleton'

/** Animated circular score meter. Pass `loading` to show a placeholder, `value = null` for N/A. */
export function ScoreRing({
  value,
  max,
  label,
  decimals = 0,
  suffix = '',
  size = 92,
  loading = false,
}: {
  value: number | null
  max: number
  label: string
  decimals?: number
  suffix?: string
  size?: number
  loading?: boolean
}) {
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = value ? Math.max(0, Math.min(1, value / max)) : 0

  return (
    <div className="flex flex-col items-center gap-2">
      {loading ? (
        <div style={{ width: size, height: size }}>
          <Skeleton className="h-full w-full rounded-full" />
        </div>
      ) : (
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90" aria-hidden>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} />
            <motion.circle
              key={`${value}-${max}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - pct) }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center font-display text-xl font-bold">
            {value ? (
              <span>
                <NumberTicker value={value} decimals={decimals} />
                {suffix}
              </span>
            ) : (
              <span className="text-muted">N/A</span>
            )}
          </div>
        </div>
      )}
      <span className="text-[11px] font-medium uppercase tracking-widest text-muted">{label}</span>
    </div>
  )
}

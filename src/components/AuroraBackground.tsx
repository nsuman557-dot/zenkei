import { cn } from '../lib/utils'

/** Soft static glow (Aceternity "Aurora Background") — gradients instead of blurred, animated blobs, so it costs nothing to paint. */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        background:
          'radial-gradient(55% 60% at 8% 0%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 70%), radial-gradient(45% 55% at 100% 45%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%)',
      }}
    />
  )
}

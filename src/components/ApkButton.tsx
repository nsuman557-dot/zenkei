import { Download } from 'lucide-react'
import { LATEST_URL, formatBytes } from '../lib/app'
import { cn } from '../lib/utils'
import { useAppRelease } from '../services/release'

/** The one download button. Points at the newest APK on GitHub as soon as the live data arrives, and at the releases page until then. */
export function ApkButton({ className, large = false }: { className?: string; large?: boolean }) {
  const { data } = useAppRelease()
  const rel = data?.latest
  const apk = rel?.primary ?? null
  const size = apk ? formatBytes(apk.size) : ''
  return (
    <a
      href={apk?.url ?? LATEST_URL}
      {...(apk ? {} : { target: '_blank' })}
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2.5 rounded-full bg-accent font-semibold text-accent-fg shadow-[0_14px_40px_-14px_var(--accent)] transition hover:brightness-110 active:scale-95',
        large ? 'h-16 px-8 text-base' : 'h-14 px-7 text-[15px]',
        className,
      )}
    >
      <Download className={large ? 'size-6' : 'size-5'} />
      Download APK
      {rel && (
        <span className="inline-flex items-center gap-2 rounded-full bg-black/20 px-2.5 py-1 text-xs font-medium">
          v{rel.version}
          {size && (
            <>
              <span aria-hidden className="h-3 w-px bg-white/40" />
              {size}
            </>
          )}
        </span>
      )}
    </a>
  )
}

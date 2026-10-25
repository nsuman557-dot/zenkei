import type { AniCharacterEdge } from '../types/anime'
import { humanize } from '../lib/utils'
import { SpotlightCard } from './SpotlightCard'

/** Character on the left, Japanese voice actor on the right. */
export function CharacterCard({ edge }: { edge: AniCharacterEdge }) {
  const va = edge.voiceActors[0]
  return (
    <SpotlightCard className="transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-stretch justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3 p-2.5">
          <img
            src={edge.node.image.large ?? ''}
            alt={edge.node.name.full}
            loading="lazy"
            className="h-[76px] w-[54px] shrink-0 rounded-lg bg-card-2 object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{edge.node.name.full}</p>
            <p className="mt-0.5 text-xs text-muted">{humanize(edge.role)}</p>
          </div>
        </div>
        {va && (
          <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-3 p-2.5 text-right">
            <img
              src={va.image.large ?? ''}
              alt={va.name.full}
              loading="lazy"
              className="h-[76px] w-[54px] shrink-0 rounded-lg bg-card-2 object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{va.name.full}</p>
              <p className="mt-0.5 text-xs text-muted">Japanese VA</p>
            </div>
          </div>
        )}
      </div>
    </SpotlightCard>
  )
}

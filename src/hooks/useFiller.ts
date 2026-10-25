import { fetchFillerList, type EpKind } from '../services/api'
import { fetchMalEpisodeKinds } from '../services/jikan'
import type { AniTitle } from '../types/anime'
import { useAsync } from './useAsync'

const TTL = 7 * 24 * 3600e3
const ckey = (id: number) => `zk:filler:${id}`
const read = (id: number): Map<number, EpKind> | null => {
  try {
    const j = JSON.parse(localStorage.getItem(ckey(id)) ?? 'null') as { t: number; k: Array<[number, EpKind]> } | null
    return j && Date.now() - j.t < TTL ? new Map(j.k) : null
  } catch {
    return null
  }
}
const write = (id: number, m: Map<number, EpKind>) => {
  try {
    localStorage.setItem(ckey(id), JSON.stringify({ t: Date.now(), k: [...m] }))
  } catch {
    /* storage full / blocked */
  }
}

/**
 * Non-canon episodes of one anime entry. Two sources are merged: AnimeFillerList (filler + mixed, used when its numbering
 * fits this entry) and MAL's own filler / recap flags (fills any gaps). Canon episodes are simply absent.
 * Never throws; a good result is kept for a week so a slow or rate-limited source cannot blank the tags later.
 */
export function useFiller(a: { id?: number; idMal: number | null; title: AniTitle; episodes: number | null } | null | undefined, on = true): Map<number, EpKind> {
  const titles = a ? [a.title.romaji, a.title.english].filter((t): t is string => !!t) : []
  const key = `${on}:${a?.idMal}:${titles.join('|')}`
  const r = useAsync(async () => {
    const out = new Map<number, EpKind>()
    if (!a || !on || !titles.length) return out
    const cid = a.idMal ?? -(a.id ?? 0)
    const hit = cid ? read(cid) : null
    if (hit) return hit
    const [afl, mal] = await Promise.all([
      fetchFillerList(titles).catch(() => null),
      a.idMal ? fetchMalEpisodeKinds(a.idMal).catch(() => null) : Promise.resolve(null),
    ])
    // AnimeFillerList counts the whole series: a split season (its length != this entry's) is skipped
    const fits = !!afl?.success && !!afl.max && (!a.episodes || afl.max === a.episodes)
    if (fits) {
      for (const n of afl!.filler ?? []) out.set(n, 'filler')
      for (const n of afl!.mixed ?? []) out.set(n, 'mixed')
    }
    for (const [n, k] of mal ?? []) if (!out.has(n)) out.set(n, k)
    // cache only when a source really answered (an empty answer for a canon-only show is fine to keep too)
    if (cid && (fits || mal)) write(cid, out)
    return out
  }, [key])
  return r.data ?? EMPTY
}

const EMPTY = new Map<number, EpKind>()

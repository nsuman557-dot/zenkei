import { getHistory } from './library'

const key = (id: number) => `zk:last:${id}`

/** Episode to resume: the continue-watching entry first, then the older per-title key. */
export function lastEpisode(id: number): number {
  const h = getHistory(id)
  if (h) return h.ep
  try {
    return Number(localStorage.getItem(key(id))) || 0
  } catch {
    return 0
  }
}

export function saveEpisode(id: number, ep: number) {
  try {
    localStorage.setItem(key(id), String(ep))
  } catch {
    /* private mode */
  }
}

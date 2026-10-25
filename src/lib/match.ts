/** Fuzzy title matching, used to map an anime's source manga / light novel onto what each reading server calls it. */

const compact = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, ' ') // "(Manga)", "[Official]"
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** 0..1: how likely two titles are the same work. Exact = 1, one title inside the other scales with length, else shared words. */
export function similarity(a: string, b: string): number {
  const x = compact(a)
  const y = compact(b)
  if (!x || !y) return 0
  if (x === y || x.replace(/ /g, '') === y.replace(/ /g, '')) return 1
  const [short, long] = x.length <= y.length ? [x, y] : [y, x]
  if (short.length >= 4 && (` ${long} `).includes(` ${short} `)) return 0.6 + 0.4 * (short.length / long.length)
  const ta = new Set(x.split(' '))
  const tb = new Set(y.split(' '))
  let shared = 0
  for (const t of ta) if (tb.has(t)) shared++
  return shared / (ta.size + tb.size - shared)
}

/** Best similarity of a candidate title against every known name of the work. */
export const bestSimilarity = (candidate: string, names: string[]) => Math.max(0, ...names.map((n) => similarity(candidate, n)))

/** Search terms to try, most specific first: each name, then the part before a subtitle ("Title: Subtitle" -> "Title"). */
export function searchVariants(names: (string | null | undefined)[]): string[] {
  const out: string[] = []
  const add = (s?: string | null) => {
    const t = (s ?? '').trim()
    if (t.length >= 3 && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t)
  }
  for (const n of names) add(n)
  for (const n of names) add((n ?? '').split(/\s*[:：\-–—]\s+/)[0])
  return out.slice(0, 6)
}

export const MATCH_AT = 0.72

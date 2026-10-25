/** Novel API client — talks to /api/novel/* (server/novel.js: NovelFire, NovelFull, WebNovel, Lnori). */
import { apiUrl, failMsg } from './api'

export type NovelSource = 'novelfire' | 'novelfull' | 'webnovel' | 'lnori'
export const NOVEL_SOURCES: { id: NovelSource; label: string }[] = [
  { id: 'novelfire', label: 'NovelFire' },
  { id: 'novelfull', label: 'NovelFull' },
  { id: 'webnovel', label: 'WebNovel' },
  { id: 'lnori', label: 'Lnori' },
]
/** The home page's source picker also has "All": every source at once. */
export type NovelScope = NovelSource | 'all'

export const isNovelSource = (s?: string): s is NovelSource => NOVEL_SOURCES.some((x) => x.id === s)

/** Image through the Referer-spoofing proxy, for pictures the CDN refuses to serve straight to the browser. */
export const proxiedNovelImage = (url: string) => apiUrl(`/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent('https://lnori.com/')}`)

/** Lnori is a light-novel library: its "chapters" are whole volumes. */
export const chapterUnit = (s: NovelSource) => (s === 'lnori' ? 'volume' : 'chapter')

export interface NovelItem {
  id: string
  slug: string
  title: string
  cover: string
  rating?: string | null
  stats?: string | null
  genres?: string[]
  source: NovelSource
}
export interface NovelHome {
  rankings: NovelItem[]
  popular: NovelItem[]
  latest: NovelItem[]
}
export interface NovelDetail {
  slug: string
  title: string
  cover: string
  author: string
  synopsis: string
  genres: string[]
  source: NovelSource
}
export interface NovelChapterRef {
  slug: string
  title: string
  number: string
  /** volume artwork (Lnori light novels) */
  cover?: string | null
}
export interface NovelChapter {
  title: string
  paragraphs: string[]
  error?: string
}

async function get<T>(path: string, timeout = 25000): Promise<T> {
  const ctl = new AbortController()
  const t = window.setTimeout(() => ctl.abort(), timeout)
  try {
    const res = await fetch(apiUrl(path), { signal: ctl.signal })
    const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null
    if (!res.ok || !data) throw new Error(failMsg(res, data))
    return data
  } finally {
    window.clearTimeout(t)
  }
}

const memo = new Map<string, Promise<unknown>>()
function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = memo.get(key)
  if (hit) return hit as Promise<T>
  const p = fn().catch((e) => {
    memo.delete(key)
    throw e
  })
  memo.set(key, p)
  return p
}

const q = (o: Record<string, string>) => new URLSearchParams(o).toString()
const norm = (n: Partial<NovelItem>, source: NovelSource): NovelItem | null => {
  const slug = n.slug || n.id
  if (!slug) return null
  return {
    id: slug,
    slug,
    title: n.title || slug.replace(/-/g, ' '),
    cover: n.cover || '',
    rating: n.rating ?? null,
    stats: n.stats ?? null,
    genres: n.genres ?? [],
    source,
  }
}
const normList = (l: Partial<NovelItem>[] | undefined, source: NovelSource) =>
  (l ?? []).map((n) => norm(n, source)).filter((n): n is NovelItem => !!n)

export function fetchNovelHome(source: NovelSource): Promise<NovelHome> {
  return once(`home:${source}`, async () => {
    const d = await get<Partial<Record<keyof NovelHome, Partial<NovelItem>[]>>>(`/api/novel/home?${q({ source })}`)
    const popular = normList(d.popular, source)
    return { rankings: normList(d.rankings, source), popular, latest: normList(d.latest, source) }
  })
}

export async function searchNovels(source: NovelSource, term: string): Promise<NovelItem[]> {
  const d = await get<{ results: Partial<NovelItem>[] }>(`/api/novel/search?${q({ source, q: term })}`)
  return normList(d.results, source)
}

export function fetchNovelDetail(source: NovelSource, slug: string): Promise<NovelDetail> {
  return once(`detail:${source}:${slug}`, async () => {
    const d = await get<{ detail: NovelDetail }>(`/api/novel/detail?${q({ source, slug })}`)
    return { ...d.detail, source }
  })
}

export function fetchNovelChapters(source: NovelSource, slug: string): Promise<NovelChapterRef[]> {
  return once(`chapters:${source}:${slug}`, async () => {
    const d = await get<{ chapters: NovelChapterRef[] }>(`/api/novel/chapters?${q({ source, slug })}`, 40000)
    return d.chapters ?? []
  })
}

export async function fetchNovelChapter(source: NovelSource, novelSlug: string, chapterSlug: string): Promise<NovelChapter> {
  const d = await get<NovelChapter>(`/api/novel/read?${q({ source, novelSlug, chapterSlug })}`, 40000)
  if (d.error || !d.paragraphs?.length) throw new Error(d.error ?? 'This chapter has no text yet.')
  return d
}

/* ---------------- universal ("All") ---------------- */
const normTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Round-robin across sources, dropping titles another source already supplied (WebNovel mirrors NovelFire). */
function interleave(lists: NovelItem[][], max = 40): NovelItem[] {
  const seen = new Set<string>()
  const out: NovelItem[] = []
  for (let i = 0; out.length < max && lists.some((l) => i < l.length); i++) {
    for (const l of lists) {
      const n = l[i]
      const key = n && normTitle(n.title)
      if (n && key && !seen.has(key)) {
        seen.add(key)
        out.push(n)
      }
    }
  }
  return out
}

const settled = async <T>(jobs: Promise<T>[]) => (await Promise.allSettled(jobs)).flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))

/** Home shelves from every source, merged. Fails only if every source does. */
export function fetchNovelHomeAll(): Promise<NovelHome> {
  return once('home:all', async () => {
    const homes = await settled(NOVEL_SOURCES.map((s) => fetchNovelHome(s.id)))
    if (!homes.length) throw new Error('No novel source answered. Try again in a moment.')
    return {
      rankings: interleave(homes.map((h) => h.rankings), 20),
      popular: interleave(homes.map((h) => h.popular), 40),
      latest: interleave(homes.map((h) => h.latest), 40),
    }
  })
}

/** Universal search: every source at once, exact and prefix matches first. Sources that are down are skipped. */
export async function searchNovelsEverywhere(term: string): Promise<NovelItem[]> {
  const lists = await settled(NOVEL_SOURCES.map((s) => searchNovels(s.id, term)))
  const q = normTitle(term)
  const rank = (n: NovelItem) => (normTitle(n.title) === q ? 0 : normTitle(n.title).startsWith(q) ? 1 : 2)
  return interleave(lists, 60)
    .map((n, i) => ({ n, i }))
    .sort((a, b) => rank(a.n) - rank(b.n) || a.i - b.i)
    .map((x) => x.n)
}

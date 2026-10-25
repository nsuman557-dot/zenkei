import { useEffect, useSyncExternalStore } from 'react'
import { APP_REPO } from '../lib/app'
import { apiUrl } from './api'

/**
 * Live Zenkai app release data from GitHub.
 *
 * Source order: the Zenkai API (`/api/app/release`, cached at the edge so visitors share GitHub's rate limit)
 * then GitHub's public API directly. The last good answer is kept in localStorage, shown instantly on the next
 * visit, and refreshed in the background (every 5 minutes while a tab is open, and whenever the tab regains focus).
 */

interface GhAsset {
  name: string
  size: number
  download_count: number
  browser_download_url: string
}
interface GhRelease {
  tag_name: string
  name: string | null
  body: string | null
  html_url: string
  published_at: string | null
  prerelease: boolean
  draft: boolean
  assets: GhAsset[]
}
interface GhRepo {
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  pushed_at: string | null
}
interface Payload {
  repo: GhRepo
  releases: GhRelease[]
}

export interface ReleaseNote {
  /** leading emoji of the line, if it has one */
  icon: string | null
  text: string
}
export interface ReleaseSection {
  title: string | null
  items: ReleaseNote[]
}
export interface ApkFile {
  name: string
  /** Universal, arm64-v8a, ... */
  label: string
  size: number
  downloads: number
  url: string
}
export interface AppRelease {
  tag: string
  version: string
  title: string
  publishedAt: string | null
  url: string
  apks: ApkFile[]
  /** the build most people want (universal, else arm64, else the first one) */
  primary: ApkFile | null
  sections: ReleaseSection[]
  virusTotal: string | null
  downloads: number
}
export interface AppData {
  latest: AppRelease | null
  previous: AppRelease[]
  totalDownloads: number
  stars: number
  forks: number
  issues: number
  pushedAt: string | null
  /** when this snapshot was fetched, ms */
  fetchedAt: number
}
export interface ReleaseState {
  data: AppData | null
  loading: boolean
  failed: boolean
}

/* ---------------- parsing ---------------- */
const EMOJI = /^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier})*)\s*/u

const clean = (s: string) =>
  s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()

function parseNotes(body: string): ReleaseSection[] {
  const sections: ReleaseSection[] = []
  let cur: ReleaseSection | null = null
  for (const line of body.split(/\r?\n/)) {
    const h = line.match(/^#{1,6}\s+(.*)$/)
    if (h) {
      cur = { title: clean(h[1]), items: [] }
      sections.push(cur)
      continue
    }
    const b = line.match(/^\s*[-*+]\s+(.*)$/)
    if (!b) continue
    if (!cur) {
      cur = { title: null, items: [] }
      sections.push(cur)
    }
    const text = clean(b[1])
    const e = text.match(EMOJI)
    cur.items.push({ icon: e ? e[1] : null, text: e ? text.slice(e[0].length) : text })
  }
  return sections.filter((s) => s.items.length > 0)
}

function apkLabel(name: string, only: boolean): string {
  const n = name.toLowerCase()
  if (n.includes('universal')) return 'Universal'
  if (n.includes('arm64')) return 'arm64-v8a'
  if (n.includes('armeabi') || n.includes('v7a')) return 'armeabi-v7a'
  if (n.includes('x86_64')) return 'x86_64'
  if (n.includes('x86')) return 'x86'
  return only ? 'Android' : 'Standard'
}

function toRelease(r: GhRelease): AppRelease {
  const files = (r.assets ?? []).filter((a) => /\.apk$/i.test(a.name))
  const apks: ApkFile[] = files.map((a) => ({ name: a.name, label: apkLabel(a.name, files.length === 1), size: a.size, downloads: a.download_count, url: a.browser_download_url }))
  const primary = apks.find((a) => a.label === 'Universal') ?? apks.find((a) => a.label === 'arm64-v8a') ?? apks[0] ?? null
  const body = r.body ?? ''
  return {
    tag: r.tag_name,
    version: r.tag_name.replace(/^v/i, ''),
    title: r.name || r.tag_name,
    publishedAt: r.published_at,
    url: r.html_url,
    apks,
    primary,
    sections: parseNotes(body),
    virusTotal: body.match(/https?:\/\/(?:www\.)?virustotal\.com\/[^\s)\]>"']+/i)?.[0] ?? null,
    downloads: apks.reduce((n, a) => n + a.downloads, 0),
  }
}

function build(p: Payload, at: number): AppData {
  const stable = p.releases.filter((r) => !r.draft && !r.prerelease).map(toRelease)
  const latest = stable.find((r) => r.apks.length > 0) ?? stable[0] ?? null
  return {
    latest,
    previous: stable.filter((r) => r !== latest).slice(0, 5),
    totalDownloads: stable.reduce((n, r) => n + r.downloads, 0),
    stars: p.repo.stargazers_count,
    forks: p.repo.forks_count,
    issues: p.repo.open_issues_count,
    pushedAt: p.repo.pushed_at,
    fetchedAt: at,
  }
}

/* ---------------- network + cache ---------------- */
const KEY = 'zenkai-app-release-v1'
const TTL = 5 * 60e3

async function getJson<T>(url: string, ms = 12000): Promise<T> {
  const ctl = new AbortController()
  const t = window.setTimeout(() => ctl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`Request failed (${res.status})`)
    return (await res.json()) as T
  } finally {
    window.clearTimeout(t)
  }
}

async function loadPayload(): Promise<Payload> {
  try {
    const [repo, releases] = await Promise.all([
      getJson<GhRepo>(`https://api.github.com/repos/${APP_REPO}`),
      getJson<GhRelease[]>(`https://api.github.com/repos/${APP_REPO}/releases?per_page=30`),
    ])
    return { repo, releases }
  } catch {
    // ponytail: GitHub rate-limited for this visitor -> Worker's shared cache
    const j = await getJson<Partial<Payload> & { success?: boolean }>(apiUrl('/api/app/release'))
    if (j.success === false || !j.repo || !Array.isArray(j.releases)) throw new Error('release unavailable')
    return { repo: j.repo, releases: j.releases }
  }
}

function readCache(): AppData | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as { at: number; payload: Payload }
    return c?.payload?.repo && Array.isArray(c.payload.releases) ? build(c.payload, c.at) : null
  } catch {
    return null
  }
}

function writeCache(payload: Payload, at: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ at, payload }))
  } catch {
    /* storage unavailable: live data still works, it just is not remembered */
  }
}

/* ---------------- tiny store ---------------- */
let state: ReleaseState = { data: readCache(), loading: false, failed: false }
const subs = new Set<() => void>()
const setState = (s: ReleaseState) => {
  state = s
  subs.forEach((f) => f())
}
let inflight: Promise<void> | null = null

/** Fetches fresh data unless the snapshot is younger than 5 minutes (or `force`). Safe to call from anywhere, any number of times. */
export function refreshRelease(force = false): Promise<void> {
  const age = state.data ? Date.now() - state.data.fetchedAt : Infinity
  if (!force && age < TTL) return Promise.resolve()
  if (inflight) return inflight
  setState({ ...state, loading: true })
  inflight = loadPayload()
    .then((p) => {
      const at = Date.now()
      writeCache(p, at)
      setState({ data: build(p, at), loading: false, failed: false })
    })
    .catch(() => setState({ ...state, loading: false, failed: true }))
    .finally(() => {
      inflight = null
    })
  return inflight
}

const subscribe = (f: () => void) => {
  subs.add(f)
  return () => {
    subs.delete(f)
  }
}
const snapshot = () => state

/** Live release state for any component. Mounting it starts the background refresh. */
export function useAppRelease(): ReleaseState {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot)
  useEffect(() => {
    void refreshRelease()
    const tick = () => {
      if (!document.hidden) void refreshRelease()
    }
    const id = window.setInterval(tick, 60e3)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('online', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('online', tick)
    }
  }, [])
  return s
}

import { useSyncExternalStore } from 'react'
import { applyRemote, cell, getPrefs, syncHooks, type ListStatus, type Meta, type RemoteEntry, type SyncPatch } from './library'
import { saveProfile, type Profile } from './profile'
import { toast } from './toast'
import { pickTitle } from './utils'
import type { AniCardMedia } from '../types/anime'

/**
 * AniList login, no backend: OAuth "implicit" grant (the token comes back in the URL hash) and
 * direct GraphQL calls from the browser. Set VITE_ANILIST_CLIENT_ID and register
 * `<your site>/auth/anilist` as the redirect URL on anilist.co/settings/developer.
 */
const CLIENT_ID = ((import.meta.env.VITE_ANILIST_CLIENT_ID as string | undefined) ?? '').trim() || '53784'
export const ANILIST_READY = !!CLIENT_ID
const ENDPOINT = 'https://graphql.anilist.co'

export interface ALUser {
  id: number
  name: string
  url: string
  avatar: string | null
  banner: string | null
  anime: { count: number; episodes: number; minutes: number }
  manga: { count: number; chapters: number }
}
interface Link {
  token: string
  expires: number // epoch ms
  user: ALUser | null
  sync: boolean // keep name / picture / banner following AniList
  lists?: boolean // sync watchlist + episode progress (on unless false)
  lastSync?: number // last list pull, epoch ms
}

const store = cell<Link | null>('zk:anilist', null)
export const useAniList = () => useSyncExternalStore(store.subscribe, store.get)
export const getAniListToken = () => {
  const l = store.get()
  return l && l.expires > Date.now() ? l.token : null
}

export const connectAniList = () => {
  if (!CLIENT_ID) return
  location.href = `https://anilist.co/api/v2/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&response_type=token`
}
export const disconnectAniList = () => (store.set(null), queue.set([]))
export const setAniListLists = (lists: boolean) => {
  const l = store.get()
  if (l) store.set({ ...l, lists })
}
export const setAniListSync = (sync: boolean) => {
  const l = store.get()
  if (l) store.set({ ...l, sync })
}

class ALError extends Error {
  constructor(message: string, readonly kind: 'auth' | 'network' | 'rate' | 'api', readonly status = 0) {
    super(message)
  }
}

async function gql<T>(query: string, token: string, variables?: Record<string, unknown>): Promise<T> {
  const r = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  }).catch(() => {
    throw new ALError('Could not reach AniList.', 'network')
  })
  const j = (await r.json().catch(() => null)) as { data?: T; errors?: Array<{ message: string; status?: number }> } | null
  if (r.status === 401 || (j?.errors?.[0] && /invalid token/i.test(j.errors[0].message))) {
    disconnectAniList()
    throw new ALError('AniList session expired. Connect again.', 'auth', 401)
  }
  if (r.status === 429) throw new ALError('AniList rate limit reached. Retrying soon.', 'rate', 429)
  if (r.status >= 500) throw new ALError(`AniList is having trouble (${r.status}).`, 'network', r.status)
  if (!r.ok || !j?.data) throw new ALError(j?.errors?.[0]?.message ?? `AniList error (${r.status}).`, 'api', r.status)
  return j.data
}

const VIEWER = `query{Viewer{id name siteUrl bannerImage avatar{large}
  statistics{anime{count episodesWatched minutesWatched} manga{count chaptersRead}}}}`

interface ViewerRes {
  Viewer: {
    id: number
    name: string
    siteUrl: string
    bannerImage: string | null
    avatar: { large: string | null } | null
    statistics: { anime: { count: number; episodesWatched: number; minutesWatched: number }; manga: { count: number; chaptersRead: number } }
  }
}

async function fetchViewer(token: string): Promise<ALUser> {
  const v = (await gql<ViewerRes>(VIEWER, token)).Viewer
  return {
    id: v.id,
    name: v.name,
    url: v.siteUrl,
    avatar: v.avatar?.large ?? null,
    banner: v.bannerImage,
    anime: { count: v.statistics.anime.count, episodes: v.statistics.anime.episodesWatched, minutes: v.statistics.anime.minutesWatched },
    manga: { count: v.statistics.manga.count, chapters: v.statistics.manga.chaptersRead },
  }
}

export type ProfileField = 'name' | 'picture' | 'banner'
const FIELDS: Array<[ProfileField, 'name' | 'avatar' | 'banner']> = [
  ['name', 'name'],
  ['picture', 'avatar'],
  ['banner', 'banner'],
]

/**
 * Pull the AniList profile into Zenkai. `force` replaces everything; otherwise a field is only filled when it is
 * empty here, or (with sync on) when it changed on AniList since the last pull, so your local edits are never
 * overwritten by an unchanged AniList profile. Returns which fields changed.
 */
export async function pullAniListProfile(local: Profile, force = false): Promise<ProfileField[]> {
  const link = store.get()
  const token = getAniListToken()
  if (!link || !token) throw new Error('Not connected to AniList.')
  const next = await fetchViewer(token)
  const prev = link.user
  const patch: Partial<Profile> = {}
  const changed: ProfileField[] = []
  for (const [field, key] of FIELDS) {
    const incoming = next[key]
    if (!incoming) continue
    const empty = !local[key]
    const moved = !!prev && prev[key] !== incoming
    if (force ? local[key] !== incoming : empty || (link.sync && moved)) {
      patch[key] = incoming
      changed.push(field)
    }
  }
  if (changed.length) saveProfile(patch)
  store.set({ ...link, user: next })
  return changed
}

/** Finishes the redirect from AniList (`#access_token=…`). Returns an error message, or null on success. */
export async function finishAniListLogin(hash: string, local: Profile): Promise<string | null> {
  const q = new URLSearchParams(hash.replace(/^#/, ''))
  const token = q.get('access_token')
  if (!token) return q.get('error_description') ?? q.get('error') ?? 'AniList did not return a login.'
  const ttl = Number(q.get('expires_in')) || 31536000
  store.set({ token, expires: Date.now() + ttl * 1000 - 60000, user: null, sync: true })
  try {
    await pullAniListProfile(local)
    await pullAniListLists().catch(() => 0)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not load your AniList profile.'
  }
}

/* ---------------- watchlist + progress sync ---------------- */
const TO_AL: Record<ListStatus, string> = { watching: 'CURRENT', planning: 'PLANNING', completed: 'COMPLETED', paused: 'PAUSED', dropped: 'DROPPED' }
const FROM_AL: Record<string, ListStatus> = { CURRENT: 'watching', REPEATING: 'watching', PLANNING: 'planning', COMPLETED: 'completed', PAUSED: 'paused', DROPPED: 'dropped' }

interface QItem extends SyncPatch {
  id: number
  del?: boolean
}
const queue = cell<QItem[]>('zk:al:queue', [])
const listsOn = () => {
  const l = store.get()
  return !!l && l.lists !== false && l.expires > Date.now()
}

const SAVE = 'mutation($id:Int,$status:MediaListStatus,$progress:Int){SaveMediaListEntry(mediaId:$id,status:$status,progress:$progress){id}}'
const FIND = 'query($id:Int,$uid:Int){MediaList(mediaId:$id,userId:$uid){id}}'
const DEL = 'mutation($id:Int){DeleteMediaListEntry(id:$id){deleted}}'

let timer = 0
const enqueue = (it: QItem) => {
  if (!listsOn()) return
  const cur = queue.get()
  const old = cur.find((x) => x.id === it.id)
  const merged: QItem = it.del
    ? { id: it.id, del: true }
    : { ...old, ...it, del: false, progress: Math.max(old?.progress ?? 0, it.progress ?? 0) || undefined, status: it.status ?? old?.status, label: it.label ?? old?.label }
  queue.set([...cur.filter((x) => x.id !== it.id), merged])
  window.clearTimeout(timer)
  timer = window.setTimeout(() => void flushAniList(true), 1200)
}

let flushing = false
/** Send queued changes to AniList. Network / rate-limit failures keep the queue for the next try; anything AniList rejects is dropped. */
export async function flushAniList(announce = false) {
  const token = getAniListToken()
  if (!token || flushing || !listsOn()) return
  flushing = true
  try {
    for (let guard = 0; guard < 50; guard++) {
      const it = queue.get()[0]
      if (!it) break
      try {
        if (it.del) {
          const uid = store.get()?.user?.id
          const found = await gql<{ MediaList: { id: number } | null }>(FIND, token, { id: it.id, uid }).catch((e) => {
            if (e instanceof ALError && e.status === 404) return { MediaList: null }
            throw e
          })
          if (found.MediaList) await gql(DEL, token, { id: found.MediaList.id })
        } else {
          await gql(SAVE, token, { id: it.id, status: it.status ? TO_AL[it.status] : undefined, progress: it.progress })
          if (announce && it.label && it.progress) toast(`Synced to AniList · ${it.label}`, 'info')
        }
      } catch (e) {
        if (e instanceof ALError && e.kind === 'api') {
          queue.set(queue.get().filter((x) => x !== it)) // AniList refused this one: do not block the rest
          continue
        }
        break // offline, rate limited or logged out: keep the queue
      }
      const now = queue.get().find((x) => x.id === it.id)
      if (JSON.stringify(now) === JSON.stringify(it)) queue.set(queue.get().filter((x) => x.id !== it.id))
      await new Promise((r) => setTimeout(r, 350))
    }
  } finally {
    flushing = false
  }
}

const LISTS = `query($uid:Int){MediaListCollection(userId:$uid,type:ANIME){lists{entries{status progress updatedAt
  media{id idMal title{romaji english native} coverImage{extraLarge large color} genres averageScore episodes format status seasonYear}}}}}`

interface ListsRes {
  MediaListCollection: { lists: Array<{ entries: Array<{ status: string; progress: number | null; updatedAt: number | null; media: AniCardMedia }> }> }
}

/** Pull the AniList anime list into the watchlist and Continue Watching. Returns how many entries were read. */
export async function pullAniListLists(): Promise<number> {
  const link = store.get()
  const token = getAniListToken()
  if (!link || !token) throw new Error('Not connected to AniList.')
  await flushAniList()
  const uid = link.user?.id ?? (await fetchViewer(token)).id
  const data = await gql<ListsRes>(LISTS, token, { uid })
  const pending = new Set(queue.get().map((q) => q.id)) // local changes still waiting to be sent win
  const seen = new Map<number, RemoteEntry>()
  for (const l of data.MediaListCollection.lists)
    for (const e of l.entries) {
      const st = FROM_AL[e.status]
      if (!st || pending.has(e.media.id) || seen.has(e.media.id)) continue
      const m = e.media
      const card: Meta = { id: m.id, title: pickTitle(m.title), image: m.coverImage.large || m.coverImage.extraLarge || '', color: m.coverImage.color, score: m.averageScore, format: m.format, episodes: m.episodes, year: m.seasonYear }
      seen.set(m.id, { meta: card, status: st, progress: e.progress ?? 0, updated: (e.updatedAt ?? 0) * 1000 || Date.now() })
    }
  const prefs = getPrefs()
  applyRemote([...seen.values()], prefs.server ?? 'megaplay', prefs.audio ?? 'sub')
  const cur = store.get()
  if (cur) store.set({ ...cur, lastSync: Date.now() })
  return seen.size
}

const THROTTLE = 5 * 60 * 1000
async function autoPull() {
  const l = store.get()
  if (!listsOn() || (l?.lastSync && Date.now() - l.lastSync < THROTTLE)) return
  try {
    const n = await pullAniListLists()
    if (n) toast('Watchlist synced from AniList', 'info')
  } catch {
    /* offline: try again later */
  }
}

let started = false
/** Call once at app start: wires local changes to AniList, then keeps the list fresh. */
export function initAniListSync() {
  if (started) return
  started = true
  syncHooks.active = listsOn
  syncHooks.push = (id, p) => enqueue({ id, ...p })
  syncHooks.remove = (id) => enqueue({ id, del: true })
  window.addEventListener('online', () => void flushAniList(false))
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && void autoPull())
  void flushAniList(false).then(autoPull)
}

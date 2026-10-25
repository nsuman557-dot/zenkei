export interface ChangelogItem {
  badge: string
  badgeVariant: 'emerald' | 'indigo' | 'amber' | 'cyan' | 'crimson'
  title: string
  description: string
}

export interface ReleaseData {
  version: string
  releaseDate: string
  title: string
  tagline: string
  githubUrl: string
  highlights: ChangelogItem[]
}

export const CURRENT_RELEASE: ReleaseData = {
  version: '1.0.2',
  releaseDate: 'October 20, 2026',
  title: 'Community Hub & Regional Audio Update',
  tagline: 'Expanded regional language audio streams, real-time community group chat, and instant in-player issue reporting.',
  githubUrl: 'https://github.com/nyyrox2/Zenkai/releases/tag/v1.0.2',
  highlights: [
    {
      badge: 'COMMUNITY',
      badgeVariant: 'emerald',
      title: 'Live Anime Group Chat',
      description:
        'Real-time group chat channels with Instagram/Messenger-style speech bubbles, heart reactions, message editing & deletion, and direct AniList anime search & card tagging.',
    },
    {
      badge: 'AUDIO & DUBS',
      badgeVariant: 'indigo',
      title: 'Expanded Regional Languages & Dubs',
      description:
        'Added full regional language and multi-audio stream support across popular anime franchises and movie catalogs, including Shin-chan, Doraemon, Rurouni Kenshin (2023), and Black Clover.',
    },
    {
      badge: 'STREAMING',
      badgeVariant: 'amber',
      title: 'Long-Running Anime Stream Sync',
      description:
        'Enhanced multi-audio stream stability and episode synchronization for long-running continuous series like One Piece, Black Clover, and Detective Conan.',
    },
    {
      badge: 'REPORTING',
      badgeVariant: 'cyan',
      title: 'In-Player Stream Issue Reporting',
      description:
        'Instant 1-click issue reporting directly from the video player controls with auto-detected playback timestamp, server, audio mode, and episode details.',
    },
  ],
}

const STORAGE_KEY = 'zenkai_release_seen_version'
const EVENT_NAME = 'zenkai:changelog-toggle'

export function hasSeenLatestRelease(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(STORAGE_KEY) === CURRENT_RELEASE.version
  } catch {
    return true
  }
}

export function markReleaseSeen(version = CURRENT_RELEASE.version): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, version)
  } catch {}
}

export function openChangelog(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { open: true } }))
}

export function closeChangelog(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { open: false } }))
}

export function onChangelogToggle(callback: (open: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => {
    const custom = e as CustomEvent<{ open?: boolean }>
    callback(Boolean(custom.detail?.open))
  }
  window.addEventListener(EVENT_NAME, handler)
  return () => window.removeEventListener(EVENT_NAME, handler)
}

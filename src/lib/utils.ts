import type { AniDate, AniTitle } from '../types/anime'

export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ')
}

export function pickTitle(t: AniTitle): string {
  return t.english || t.romaji || t.native || 'Untitled'
}

export function stripHtml(input?: string | null): string {
  if (!input) return ''
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const FORMATS: Record<string, string> = {
  TV: 'TV',
  TV_SHORT: 'TV Short',
  MOVIE: 'Movie',
  SPECIAL: 'Special',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Music',
}

export function formatLabel(format?: string | null): string {
  if (!format) return '—'
  return FORMATS[format] ?? humanize(format)
}

export function formatStatus(status?: string | null): string {
  if (!status) return '—'
  if (status === 'RELEASING') return 'Airing'
  if (status === 'NOT_YET_RELEASED') return 'Upcoming'
  return humanize(status)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDate(d?: AniDate | null): string | null {
  if (!d || !d.year) return null
  const month = d.month ? MONTHS[d.month - 1] : null
  return [month, d.day, d.year].filter(Boolean).join(' ')
}

export function compact(n?: number | null): string {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function toScore10(score100?: number | null): string {
  if (!score100) return '—'
  return (score100 / 10).toFixed(1)
}

export type Season = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'

export function getSeason(date: Date = new Date()): { season: Season; year: number } {
  const m = date.getMonth()
  const season: Season = m <= 1 || m === 11 ? 'WINTER' : m <= 4 ? 'SPRING' : m <= 7 ? 'SUMMER' : 'FALL'
  // December belongs to the following winter season on AniList.
  const year = m === 11 ? date.getFullYear() + 1 : date.getFullYear()
  return { season, year }
}

import type {
  AniCardMedia,
  AniRecommendationNode,
  AniRelationEdge,
  CardItem,
  JikanAnimeSummary,
} from '../types/anime'
import { humanize, pickTitle } from './utils'

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="460" height="690"><rect width="100%" height="100%" fill="#1a1a20"/></svg>',
  )

export function mediaToCard(m: AniCardMedia): CardItem {
  return {
    id: m.id,
    href: `/anime/${m.id}`,
    title: pickTitle(m.title),
    image: m.coverImage.large || m.coverImage.extraLarge || PLACEHOLDER,
    image2x: m.coverImage.extraLarge ?? undefined,
    color: m.coverImage.color,
    score: m.averageScore,
    format: m.format,
    episodes: m.episodes,
    year: m.seasonYear,
    genres: m.genres,
  }
}

export function recommendationToCard(node: AniRecommendationNode): CardItem | null {
  const m = node.mediaRecommendation
  if (!m) return null
  return {
    id: m.id,
    href: `/anime/${m.id}`,
    title: pickTitle(m.title),
    image: m.coverImage.large || PLACEHOLDER,
    color: m.coverImage.color,
    score: m.averageScore,
    format: m.format,
    episodes: m.episodes,
    year: m.seasonYear,
  }
}

export function relationToCard(edge: AniRelationEdge): CardItem {
  const n = edge.node
  return {
    id: n.id,
    href: `/anime/${n.id}`,
    title: pickTitle(n.title),
    image: n.coverImage.large || PLACEHOLDER,
    color: n.coverImage.color,
    score: n.averageScore,
    format: n.format,
    episodes: n.episodes,
    year: n.seasonYear,
    caption: humanize(edge.relationType),
  }
}

export function malToCard(a: JikanAnimeSummary): CardItem {
  return {
    id: a.mal_id,
    href: `/mal/${a.mal_id}`,
    title: a.title_english || a.title,
    image: a.images.webp?.large_image_url || a.images.jpg?.large_image_url || PLACEHOLDER,
    score: a.score ? Math.round(a.score * 10) : null,
    format: a.type,
    episodes: a.episodes,
    year: a.year,
    genres: a.genres.map((g) => g.name),
  }
}

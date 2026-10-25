import type { BookCardItem } from '../components/BookCard'
import { genreName, img, movieHref, type MovieItem } from '../services/movies'

/** MovieItem -> the shared poster card (same card the novel / manga shelves use). */
export const toMovieCard = (m: MovieItem): BookCardItem => ({
  key: `${m.type}:${m.id}`,
  href: movieHref(m),
  title: m.title,
  image: img(m.poster, 'w342') ?? '',
  score: m.rating ? m.rating.toFixed(1) : null,
  badge: m.type === 'tv' ? 'TV' : null,
  caption: m.year,
  genres: m.genreIds.map((g) => genreName(m.type, g)).filter((g): g is string => !!g),
  cta: 'Watch now →',
})

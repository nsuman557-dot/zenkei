import { BookCard, type BookCardItem } from './BookCard'
import { Skeleton } from './Skeleton'

/** Responsive poster grid with skeletons — search results and "all titles" sections. */
export function BookGrid({ items, loading = false, empty = 'Nothing found.' }: { items?: BookCardItem[]; loading?: boolean; empty?: string }) {
  if (!loading && (!items || items.length === 0)) return <p className="px-4 py-16 text-center text-sm text-muted sm:px-6">{empty}</p>
  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-x-4 gap-y-8 px-4 sm:grid-cols-3 sm:gap-x-5 sm:px-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {loading || !items
        ? Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
              <Skeleton className="mt-3 h-4 w-4/5" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))
        : items.map((item, i) => <BookCard key={item.key} item={item} index={i} fluid />)}
    </div>
  )
}

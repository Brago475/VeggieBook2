import '../../styles/books.css'
import '../../styles/shimmer.css'
import { BlockSkeleton } from './BlockSkeleton'
import { CardRowSkeleton } from './CardRowSkeleton'

// Outline of the Books page: number cards, the filter card, and book tiles.

const TILES = 8

export function BooksSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading books">
      <div className="sk-stack" aria-hidden="true">
        <CardRowSkeleton className="bk-stats" />

        <BlockSkeleton height={110} />

        <div className="bk-grid">
          {Array.from({ length: TILES }, (_, i) => (
            <div key={i} className="card sk-tile">
              <span className="sk sk-cover" />
              <span className="sk sk-line is-mid" />
              <span className="sk sk-line is-short" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
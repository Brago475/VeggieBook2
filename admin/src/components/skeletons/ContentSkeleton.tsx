import '../../styles/content-library.css'
import '../../styles/shimmer.css'
import { BlockSkeleton } from './BlockSkeleton'
import { CardRowSkeleton } from './CardRowSkeleton'

// Outline of the Content page: number cards, the filter card, and tiles.

const TILES = 8

export function ContentSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading content">
      <div className="sk-stack" aria-hidden="true">
        <CardRowSkeleton className="ct-stats" />

        <BlockSkeleton height={120} />

        <div className="ct-grid">
          {Array.from({ length: TILES }, (_, i) => (
            <div key={i} className="card sk-tile">
              <span className="sk sk-cover" />
              <span className="sk sk-line is-short" />
              <span className="sk sk-line is-mid" />
              <span className="sk sk-line is-short" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
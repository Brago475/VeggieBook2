import '../../styles/books.css'
import '../../styles/activity.css'
import '../../styles/shimmer.css'
import { BlockSkeleton } from './BlockSkeleton'
import { ListSkeleton } from './ListSkeleton'
import { StatCardSkeleton } from './StatCardSkeleton'

// Outline of the Activity page: four number cards, the filter card, and
// the feed.

const CARDS = 4

export function ActivitySkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading activity">
      <div className="sk-stack" aria-hidden="true">
        <div className="bk-stats">
          {Array.from({ length: CARDS }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        <BlockSkeleton height={110} />

        <div className="card sk-block">
          <span className="sk sk-title has-space" />
          <ListSkeleton rows={8} />
        </div>
      </div>
    </div>
  )
}
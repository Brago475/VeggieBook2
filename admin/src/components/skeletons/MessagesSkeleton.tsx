import '../../styles/shimmer.css'
import { CardRowSkeleton } from './CardRowSkeleton'
import { ListSkeleton } from './ListSkeleton'

// Outline of the Notifications page's Messages section: the four number
// cards, then the list card with its title, tabs and rows.

const ROWS = 5

export function MessagesSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading notifications">
      <div className="sk-stack" aria-hidden="true">
        <CardRowSkeleton className="nt-stats" />

        <div className="card sk-block">
          <div className="sk-bar-row">
            <span className="sk sk-title" />
            <span className="sk sk-tabs" />
          </div>
          <ListSkeleton rows={ROWS} />
        </div>
      </div>
    </div>
  )
}
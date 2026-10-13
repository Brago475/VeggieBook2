import '../../styles/studies.css'
import '../../styles/shimmer.css'
import { BlockSkeleton } from './BlockSkeleton'
import { ListSkeleton } from './ListSkeleton'

// Outline of the Studies page: the running study, the timeline, and the
// selected study's books.

export function StudiesSkeleton() {
  return (
    <div className="st-page" role="status" aria-busy="true" aria-label="Loading studies">
      <div className="sk-stack" aria-hidden="true">
        <div className="card sk-block">
          <span className="sk sk-title has-space" />
          <span className="sk-lines">
            <span className="sk sk-line is-mid" />
            <span className="sk sk-line is-short" />
          </span>
          <span className="sk sk-button" style={{ marginTop: 16 }} />
        </div>

        <BlockSkeleton height={180} title />

        <div className="card sk-block">
          <span className="sk sk-title has-space" />
          <ListSkeleton rows={5} />
        </div>
      </div>
    </div>
  )
}
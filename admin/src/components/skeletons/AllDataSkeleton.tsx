import '../../styles/alldata.css'
import '../../styles/shimmer.css'
import { ListSkeleton } from './ListSkeleton'
import { TableSkeleton } from './TableSkeleton'

// Outline of the All Data table area: the table and the side panel.

export function AllDataSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading data">
      <div className="vbd-split has-panel" aria-hidden="true">
        <TableSkeleton rows={10} cols={6} />

        <div className="card sk-block">
          <span className="sk sk-title has-space" />
          <ListSkeleton rows={6} />
        </div>
      </div>
    </div>
  )
}
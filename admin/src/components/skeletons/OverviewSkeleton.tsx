import '../../styles/overview.css'
import '../../styles/shimmer.css'
import { PanelSkeleton } from './PanelSkeleton'
import { StatCardSkeleton } from './StatCardSkeleton'

// Outline of the Overview page. Uses the same row classes as the real page,
// so each shape lands where its card or panel will appear.

const CARDS = 5

export function OverviewSkeleton() {
  return (
    <div className="overview" role="status" aria-busy="true" aria-label="Loading overview">
      <div aria-hidden="true">
        <span className="sk sk-live" />

        <div className="overview-cards">
          {Array.from({ length: CARDS }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        <div className="overview-row">
          <PanelSkeleton height={260} />
          <PanelSkeleton height={260} />
        </div>

        <div className="overview-row is-even">
          <PanelSkeleton height={220} />
          <PanelSkeleton height={220} />
        </div>

        <div className="overview-row is-reverse">
          <PanelSkeleton height={240} />
          <PanelSkeleton height={240} />
        </div>

        <div className="overview-row">
          <PanelSkeleton height={200} />
          <PanelSkeleton height={200} />
        </div>
      </div>
    </div>
  )
}
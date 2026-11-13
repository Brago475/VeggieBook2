import '../../styles/studies.css'
import '../../styles/participants.css'
import '../../styles/shimmer.css'
import { BlockSkeleton } from './BlockSkeleton'
import { ListSkeleton } from './ListSkeleton'

// Outline of the Participants page: the banner with its tabs, person cards,
// and the side panel.

const PEOPLE = 6

export function ParticipantsSkeleton() {
  return (
    <div className="pt-page" role="status" aria-busy="true" aria-label="Loading participants">
      <div className="sk-stack" aria-hidden="true">
        <BlockSkeleton height={124} />

        <div className="pt-split has-panel">
          <div className="pt-cards">
            {Array.from({ length: PEOPLE }, (_, i) => (
              <div key={i} className="card sk-person">
                <span className="sk sk-dot" />
                <span className="sk-lines">
                  <span className="sk sk-line is-mid" />
                  <span className="sk sk-line is-short" />
                </span>
              </div>
            ))}
          </div>

          <div className="card sk-block">
            <span className="sk sk-title has-space" />
            <ListSkeleton rows={5} />
          </div>
        </div>
      </div>
    </div>
  )
}
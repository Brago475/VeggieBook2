import { NavIcon } from '../icons/NavIcons'

// The active study at a glance, as a card in the top row next to the
// number cards (same size and look). Studies are built in a later step, so
// for now it says no study is running and links to the Studies section.

type Props = {
  onOpen: () => void
  index?: number
}

export function StudyCard({ onOpen, index = 0 }: Props) {
  return (
    <div className="card stat-card study-card" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="stat-head">
        <span className="number-icon is-green">
          <NavIcon name="study" size={18} />
        </span>
        <span className="stat-label">Active study</span>
        <span className="stat-chip">Not running</span>
      </div>
      <div className="study-body">
        <span className="study-title">No study running</span>
        <span className="stat-note">Start one in Studies to track who joins and what they record.</span>
        <button type="button" className="button-secondary" onClick={onOpen}>
          Go to Studies
        </button>
      </div>
    </div>
  )
}
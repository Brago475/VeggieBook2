import { useStudies } from '../../hooks/useStudies'
import { NavIcon } from '../icons/NavIcons'
import { plural, studyTitle } from '../studies/studyFormat'

// The active study at a glance, as a card in the top row next to the
// number cards (same size and look).
//
//   A study is running   its name, how many days it has run, how many
//                        people are tracked, and books saved so far
//   None is running      says so, with a link to the Studies page
//
// Loads the same list as the Studies page (hooks/useStudies.ts), so the two
// always agree.

type Props = {
  onOpen: () => void
  index?: number
}

export function StudyCard({ onOpen, index = 0 }: Props) {
  const { data } = useStudies()
  const running = data?.studies.find((s) => s.running) ?? null

  return (
    <div className="card stat-card study-card" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="stat-head">
        <span className="number-icon is-green">
          <NavIcon name="study" size={18} />
        </span>
        <span className="stat-label">Active study</span>
        <span className="stat-chip">{data === null ? 'Loading' : running ? 'Running' : 'Not running'}</span>
      </div>
      <div className="study-body">
        {running ? (
          <>
            <span className="study-title">{studyTitle(running)}</span>
            <span className="stat-note">
              Running {plural(running.days, 'day', 'days')}. {plural(running.tracked, 'person', 'people')} tracked,{' '}
              {plural(running.booksSaved, 'book', 'books')} saved.
            </span>
          </>
        ) : (
          <>
            <span className="study-title">{data === null ? 'Checking...' : 'No study running'}</span>
            <span className="stat-note">Start one in Studies to track who joins and what they record.</span>
          </>
        )}
        <button type="button" className="button-secondary" onClick={onOpen}>
          {running ? 'Open Studies' : 'Go to Studies'}
        </button>
      </div>
    </div>
  )
}
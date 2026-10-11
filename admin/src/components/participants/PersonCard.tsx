import type { Participant } from '../../types/participants'
import { StudyIcon } from '../studies/StudyIcons'
import { aboutLine, booksLine, initialOf, statusLabel, statusLine } from './participantText'

// One person on the Participants page: a colored square with the first
// letter of their research ID, the ID, age and join date, their tracking
// status, and their tracked books. The whole card is a button that opens
// the side panel. Research ID only; no name or email exists here.

type Props = {
  person: Participant
  selected: boolean
  onSelect: () => void
}

export function PersonCard({ person, selected, onSelect }: Props) {
  const tone = `is-${person.status}`

  return (
    <button
      type="button"
      className={selected ? `pt-card ${tone} is-selected` : `pt-card ${tone}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="pt-card-top">
        <span className="pt-avatar" aria-hidden="true">
          {initialOf(person.researchId)}
        </span>
        <span className="pt-card-id">
          <strong>{person.researchId}</strong>
          <span>{aboutLine(person)}</span>
        </span>
      </span>

      <span className="pt-chip">
        <i aria-hidden="true" />
        {statusLabel[person.status]}
      </span>
      <span className="pt-card-line">{statusLine(person)}</span>

      <span className="pt-card-books">
        <StudyIcon name="book" size={14} />
        {booksLine(person)}
      </span>
    </button>
  )
}
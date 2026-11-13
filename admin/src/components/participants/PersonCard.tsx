import type { Participant } from '../../types/participants'
import { aboutLine, booksCount, idStyle, initialOf, latestBook, statusLine } from './participantText'
import { TrackingSwitch } from './TrackingSwitch'

// One person on the Participants page.
//
//   Head   round badge in their ID color, research ID, age and join date,
//          and the tracking switch, on a band tinted by tracking status
//   Body   book count and latest book, then a short status line
//
// A full-size button behind the content opens the side panel; the switch
// sits above it. Research ID only; no name or email exists here.

type Props = {
  person: Participant
  selected: boolean
  onSelect: () => void
  onTurnOff: () => void
  onTurnOn: () => Promise<string | null>
}

export function PersonCard({ person, selected, onSelect, onTurnOff, onTurnOn }: Props) {
  const books = booksCount(person)
  const latest = latestBook(person)
  const classes = ['pt-card', `is-${person.status}`, selected && 'is-selected'].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <button
        type="button"
        className="pt-card-open"
        aria-pressed={selected}
        aria-label={`Open ${person.researchId}`}
        onClick={onSelect}
      />

      <div className="pt-card-head">
        <span className="pt-avatar" style={idStyle(person.researchId)} aria-hidden="true">
          {initialOf(person.researchId)}
        </span>
        <span className="pt-card-id">
          <strong>{person.researchId}</strong>
          <span>{aboutLine(person)}</span>
        </span>
        <TrackingSwitch person={person} onTurnOff={onTurnOff} onTurnOn={onTurnOn} />
      </div>

      <div className="pt-card-body">
        <dl className="pt-card-stats">
          <div>
            <dt>Books</dt>
            <dd className={books ? undefined : 'is-none'}>{books ?? 'None yet'}</dd>
          </div>
          <div>
            <dt>Latest</dt>
            <dd className={latest ? undefined : 'is-none'}>{latest ?? 'None yet'}</dd>
          </div>
        </dl>
        <span className="pt-card-line">{statusLine(person)}</span>
      </div>
    </div>
  )
}
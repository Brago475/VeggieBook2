import type { ParticipantsResponse } from '../../types/participants'
import { idStyle, initialOf, trackingNote } from './participantText'

// The overlapping badges in the banner: one per person, in their ID color,
// ringed by tracking status, then "+N" for the rest. Beside them, how many
// are tracked and who is not.

const MAX_BADGES = 7

type Props = {
  people: ParticipantsResponse['people']
  counts: ParticipantsResponse['counts']
}

export function PeopleStack({ people, counts }: Props) {
  const badges = people.slice(0, MAX_BADGES)
  const extra = people.length - badges.length
  const note = trackingNote(counts)
  const summary = `${counts.on.toLocaleString()} of ${counts.all.toLocaleString()} tracked`

  return (
    <div className="pt-people">
      {badges.length > 0 && (
        <div className="pt-stack" role="img" aria-label={`${summary}. ${note.text}.`}>
          {badges.map((p) => (
            <span
              key={p.researchId}
              className={`pt-stack-badge is-${p.status}`}
              style={idStyle(p.researchId)}
              title={p.researchId}
              aria-hidden="true"
            >
              {initialOf(p.researchId)}
            </span>
          ))}
          {extra > 0 && (
            <span className="pt-stack-badge pt-stack-more" aria-hidden="true">
              +{extra.toLocaleString()}
            </span>
          )}
        </div>
      )}
      <div className="pt-stack-text">
        <strong>{summary}</strong>
        <span className={`is-${note.tone}`}>{note.text}</span>
      </div>
    </div>
  )
}
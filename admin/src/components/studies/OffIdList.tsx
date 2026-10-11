import type { OffPerson } from '../../types/studies'

// The research IDs of people with tracking off, as small chips: orange for
// people who turned it off themselves (they get the notice), gray for people
// an admin turned off (they don't). Nothing else about them is shown.

type Props = {
  people: OffPerson[]
  empty?: string
}

export function OffIdList({ people, empty = 'Everyone has tracking on.' }: Props) {
  if (people.length === 0) return <p className="st-muted">{empty}</p>

  return (
    <ul className="st-ids">
      {people.map((p) => (
        <li
          key={p.researchId}
          className={p.by === 'admin' ? 'st-id is-admin' : 'st-id'}
          title={p.by === 'admin' ? 'Turned off by an admin' : 'Turned off by them in Settings'}
        >
          <span className="st-id-code">{p.researchId}</span>
          <span className="st-id-by">{p.by === 'admin' ? 'by an admin' : 'by them'}</span>
        </li>
      ))}
    </ul>
  )
}
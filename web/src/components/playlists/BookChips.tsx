// Chips that choose which saved book's recipes the picker shows. A null id
// means all books. A chip shows how many of its recipes are picked.

export type BookChip = { id: string; label: string; picked: number }

type Props = {
  label: string
  allLabel: string
  allPicked: number
  books: BookChip[]
  active: string | null
  onChange: (id: string | null) => void
}

function Chip({ text, picked, on, onClick }: { text: string; picked: number; on: boolean; onClick: () => void }) {
  return (
    <button type="button" className={on ? 'pk-chip is-on' : 'pk-chip'} aria-pressed={on} onClick={onClick}>
      {text}
      {picked > 0 && <span className="pk-chip-count">{picked}</span>}
    </button>
  )
}

export function BookChips({ label, allLabel, allPicked, books, active, onChange }: Props) {
  return (
    <div className="pk-chips" role="group" aria-label={label}>
      <Chip text={allLabel} picked={allPicked} on={active === null} onClick={() => onChange(null)} />
      {books.map((b) => (
        <Chip key={b.id} text={b.label} picked={b.picked} on={active === b.id} onClick={() => onChange(b.id)} />
      ))}
    </div>
  )
}
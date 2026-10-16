// One checkbox row on a question screen.
//
// Wrapped in a label so tapping the text toggles the box, which doubles the
// tap target and keeps native keyboard and screen reader behavior intact.

type Props = {
  label: string
  checked: boolean
  onToggle: () => void
}

export function ChoiceRow({ label, checked, onToggle }: Props) {
  return (
    <label className="choice-row">
      <input
        type="checkbox"
        className="choice-box"
        checked={checked}
        onChange={onToggle}
      />
      <span className="choice-text">{label}</span>
    </label>
  )
}
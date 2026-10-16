// An on/off switch with its own label for screen readers.

type Props = {
  on: boolean
  label: string
  disabled?: boolean
  onChange: (on: boolean) => void
}

export function Switch({ on, label, disabled = false, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className={on ? 'se-switch is-on' : 'se-switch'}
      onClick={() => onChange(!on)}
    >
      <span className="se-switch-knob" />
    </button>
  )
}
import { MailIcon } from './AuthIcons'

// The email box used on every account screen.

type Props = {
  id: string
  value: string
  onChange: (value: string) => void
}

export function EmailField({ id, value, onChange }: Props) {
  return (
    <div className="pill-field">
      <label className="pill-label" htmlFor={id}>
        Email address
      </label>
      <div className="pill-wrap">
        <MailIcon />
        <input
          id={id}
          className="pill-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
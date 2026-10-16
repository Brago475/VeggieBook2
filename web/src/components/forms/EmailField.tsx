import { AUTH } from '../../i18n/strings/auth'
import { useStrings } from '../../i18n/useStrings'
import { MailIcon } from '../icons/AuthIcons'

// The email box used on every account screen. The label follows the site
// language unless one is passed in.

type Props = {
  id: string
  value: string
  onChange: (value: string) => void
  label?: string
}

export function EmailField({ id, value, onChange, label }: Props) {
  const t = useStrings(AUTH)

  return (
    <div className="pill-field">
      <label className="pill-label" htmlFor={id}>
        {label ?? t.email}
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
import { AUTH } from '../../i18n/strings/auth'
import { useStrings } from '../../i18n/useStrings'

// The agreement checkbox on Create Account. The links open in a new tab so
// the form is not lost while someone reads them.

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function TermsAgree({ checked, onChange }: Props) {
  const t = useStrings(AUTH)

  return (
    <label className="terms-agree">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        {t.termsBefore}
        <a href="/terms" target="_blank" rel="noopener">
          {t.terms}
        </a>
        {t.termsAnd}
        <a href="/privacy" target="_blank" rel="noopener">
          {t.privacy}
        </a>
        .
      </span>
    </label>
  )
}
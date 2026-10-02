// The agreement checkbox on Create Account. The links open in a new tab so
// the form is not lost while someone reads them.

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function TermsAgree({ checked, onChange }: Props) {
  return (
    <label className="terms-agree">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        I am 18 or older, and I agree to the{' '}
        <a href="/terms" target="_blank" rel="noopener">
          Terms of Use
        </a>{' '}
        and the{' '}
        <a href="/privacy" target="_blank" rel="noopener">
          Privacy Policy
        </a>
        .
      </span>
    </label>
  )
}
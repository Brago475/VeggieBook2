import { AUTH } from '../../i18n/strings/auth'
import { useStrings } from '../../i18n/useStrings'

// Shown to a guest who has saved books, on sign in and create account:
// move those books into the account right away, or start fresh and
// delete them.

type Props = {
  count: number
  keep: boolean
  onChange: (keep: boolean) => void
}

export function GuestBooksChoice({ count, keep, onChange }: Props) {
  const t = useStrings(AUTH)

  return (
    <fieldset className="guest-choice">
      <legend className="pill-label">{t.guestBooks}</legend>

      <label className="guest-option">
        <input
          type="radio"
          name="guest-books"
          checked={keep}
          onChange={() => onChange(true)}
        />
        <span className="guest-option-text">
          <span className="guest-option-title">{t.keepBooks(count)}</span>
          <span className="guest-option-sub">{t.keepBooksSub}</span>
        </span>
      </label>

      <label className="guest-option">
        <input
          type="radio"
          name="guest-books"
          checked={!keep}
          onChange={() => onChange(false)}
        />
        <span className="guest-option-text">
          <span className="guest-option-title">{t.startFresh}</span>
          <span className="guest-option-sub">{t.startFreshSub}</span>
        </span>
      </label>
    </fieldset>
  )
}
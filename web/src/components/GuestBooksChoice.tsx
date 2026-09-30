// Shown to a guest who has saved books, on sign in and create account:
// move those books into the account, or start fresh and delete them.

type Props = {
  count: number
  keep: boolean
  onChange: (keep: boolean) => void
  // When kept books arrive: "right away" on sign in, "once you confirm
  // your email" on create account.
  whenMoved: string
}

export function GuestBooksChoice({ count, keep, onChange, whenMoved }: Props) {
  const books = count === 1 ? '1 book' : `${count} books`

  return (
    <fieldset className="guest-choice">
      <legend className="pill-label">Your guest books</legend>

      <label className="guest-option">
        <input
          type="radio"
          name="guest-books"
          checked={keep}
          onChange={() => onChange(true)}
        />
        <span className="guest-option-text">
          <span className="guest-option-title">Keep my {books}</span>
          <span className="guest-option-sub">They move into this account {whenMoved}.</span>
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
          <span className="guest-option-title">Start fresh</span>
          <span className="guest-option-sub">Your guest books are deleted.</span>
        </span>
      </label>
    </fieldset>
  )
}
import { NavBar } from '../components/layout/NavBar'
import { SafeImage } from '../components/common/SafeImage'
import { FLOW } from '../i18n/strings/flow'
import { SECRETS } from '../i18n/strings/secrets'
import { useStrings } from '../i18n/useStrings'
import type { Secret } from '../types'

// The extra-copies step of a Secrets Book: the kept secrets as tiles, and
// a touch on one marks it for an extra printed copy. The same screen as
// ExtraCopies, with the same tiles (.copy-grid, .copy-tile), for secrets
// instead of recipes.
//
// A separate file rather than ExtraCopies taking both, so the VeggieBook
// step it was built and tested for stays exactly as it is.
//
// The checkmarks live in useSecretsFlow. Printing itself is not part of
// the web app; the choice is recorded with the book.

type Props = {
  secrets: Secret[]
  selected: number[]
  onToggle: (id: number) => void
  onNext: () => void
}

export function SecretExtraCopies({ secrets, selected, onToggle, onNext }: Props) {
  const flow = useStrings(FLOW)
  const t = useStrings(SECRETS)
  const chosen = new Set(selected)

  return (
    <>
      <div className="intro-text">
        <p>{t.extraIntro}</p>
        <p>{t.extraTouch}</p>
      </div>

      <ul className="copy-grid">
        {secrets.map((secret) => (
          <li key={secret.id}>
            <button
              type="button"
              className="copy-tile"
              onClick={() => onToggle(secret.id)}
              aria-pressed={chosen.has(secret.id)}
            >
              <SafeImage
                className="copy-tile-img"
                src={secret.image ? `/images/${secret.image}` : null}
              />
              <span className="copy-tile-title">{secret.headline}</span>
              <span
                className={
                  chosen.has(secret.id) ? 'copy-tile-box is-checked' : 'copy-tile-box'
                }
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>

      <NavBar primaryLabel={flow.next} onPrimary={onNext} />
    </>
  )
}
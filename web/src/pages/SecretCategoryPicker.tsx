import { NavBar } from '../components/NavBar'
import { ScreenLabel } from '../components/ScreenLabel'
import { SecretCategoryRow } from '../components/SecretCategoryRow'
import type { SecretCategory } from '../types'

// The first screen of a new Secrets Book, matching the original app:
// "Choose the Secrets You Want", the five categories, and Who Says So? as
// the full-width button at the bottom, the same bar Phase 1 uses for NEXT.
//
// A Secrets Book is one category, the way a VeggieBook is one vegetable.
// Picking a row goes to the transition, then to keeping or dropping that
// category's secrets; there are no questions first.
//
// Who Says So? opens the page about Maria and the families who tried the
// Secrets. It is a side trip: Back returns here.
//
// While the categories load, five gray rows the size of the real ones hold
// their place, so the list does not jump in under a line of text.

type Props = {
  categories: SecretCategory[]
  loading: boolean
  error: string | null
  onSelect: (category: SecretCategory) => void
  onWhoSaysSo: () => void
}

// One per category in the original data.
const SKELETON_ROWS = 5

export function SecretCategoryPicker({
  categories,
  loading,
  error,
  onSelect,
  onWhoSaysSo,
}: Props) {
  return (
    <>
      <ScreenLabel>Choose the Secrets You Want</ScreenLabel>

      {loading && (
        <div role="status" aria-busy="true">
          <span className="visually-hidden">Loading the kinds of secrets...</span>
          <ul aria-hidden="true">
            {Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <li key={i}>
                <div className="secret-row is-skeleton">
                  <div className="skeleton secret-skel-icon" />
                  <div className="skeleton secret-skel-name" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="message">Could not load: {error}</p>}

      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            <SecretCategoryRow category={category} onSelect={onSelect} />
          </li>
        ))}
      </ul>

      {/* Hidden until the list is there, so the bar never sits under an
          empty screen while the categories load. */}
      {!loading && !error && (
        <NavBar primaryLabel="Who Says So?" onPrimary={onWhoSaysSo} />
      )}
    </>
  )
}
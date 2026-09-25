import { useLayoutEffect } from 'react'
import { SecretCard } from '../components/SecretCard'
import type { CategorySecrets } from '../types'

// KEEP / DROP for a Secrets Book. One secret at a time, the same as the
// recipe review; kept ones become the book.
//
// Which secret is showing, and what has been kept so far, live in the
// Secrets flow hook rather than here, the same split as RecipeReview and
// useBookFlow.
//
// The buttons are the recipe review's (.decide, .decide-btn), so both
// kinds of book are made the same way.

type Props = {
  data: CategorySecrets
  index: number
  onDecide: (keep: boolean) => void
}

export function SecretReview({ data, index, onDecide }: Props) {
  const secret = data.secrets[index]

  // KEEP and DROP sit under a long secret, so without this the next one
  // would open scrolled to wherever the last one ended. A layout effect
  // runs before the browser paints, so the old position is never seen.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [index])

  if (!secret) {
    return <p className="message">There are no secrets in this category yet.</p>
  }

  return (
    <>
      {/* Keyed by secret so each one mounts fresh, and the last one's
          illustration never shows while the next one loads. */}
      <SecretCard
        key={secret.id}
        secret={secret}
        categoryName={data.category.name}
        categoryColor={data.category.color}
        position={index + 1}
        total={data.secrets.length}
      />

      <div className="decide">
        <button type="button" className="decide-btn" onClick={() => onDecide(true)}>
          KEEP
        </button>
        <button type="button" className="decide-btn" onClick={() => onDecide(false)}>
          DROP
        </button>
      </div>
    </>
  )
}
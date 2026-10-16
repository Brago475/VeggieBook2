import { useLayoutEffect } from 'react'
import { SecretCard } from '../components/secrets/SecretCard'
import { SECRETS } from '../i18n/strings/secrets'
import { useStrings } from '../i18n/useStrings'
import type { CategorySecrets } from '../types'
import '../styles/review.css'

// Keep/Drop review for a Secrets Book. Shares the recipe review's decide bar.
// Button words come from secrets.ts (Spanish uses the masculine form).

type Props = {
  data: CategorySecrets
  index: number
  onDecide: (keep: boolean) => void
}

export function SecretReview({ data, index, onDecide }: Props) {
  const t = useStrings(SECRETS)
  const secret = data.secrets[index]

  // Each secret opens at the top. Runs before paint so the old position never shows.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [index])

  if (!secret) {
    return <p className="message">{t.noSecrets}</p>
  }

  return (
    <div className="review">
      {/* Keyed so each secret mounts fresh. */}
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
          {t.keep}
        </button>
        <button type="button" className="decide-btn" onClick={() => onDecide(false)}>
          {t.drop}
        </button>
      </div>
    </div>
  )
}
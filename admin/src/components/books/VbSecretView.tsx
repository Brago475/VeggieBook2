import { useVbSecretCategory } from '../../hooks/useBookContent'
import { imageUrl } from '../../utils/images'
import { SafeImg } from './SafeImg'

// One secret, laid out the way the app shows it inside a saved Secrets
// Book (web/src/components/secrets/SecretCard.tsx): the category on its own
// color, the headline in green, the illustration and the secret, Why It
// Works, and Additional Information when there are links or a planner.
//
// Loaded from the same public /api/secret-categories/{id}/secrets the app
// uses, so it reads exactly as the person saw it. The illustrations have
// words drawn into them, so they are shown whole, never cropped.

type Props = {
  categoryId: number
  secretId: number
  position: string // "Secret 3 of 9", or "Taken out later"
  out: boolean
}

export function VbSecretView({ categoryId, secretId, position, out }: Props) {
  const { category, error, loading } = useVbSecretCategory(categoryId)

  if (loading) return <p className="vb-message">Loading the secret...</p>
  if (!category) return <p className="vb-message">{error ?? 'This secret could not be loaded.'}</p>

  const secret = category.secrets.find((s) => s.id === secretId)
  if (!secret) {
    return <p className="vb-message">This secret is no longer in the app, so it can't be shown.</p>
  }

  const planner = secret.attachment ? imageUrl(secret.attachment) : null
  const hasExtras = secret.links.length > 0 || planner !== null

  return (
    <article className="vb-detail">
      <p className={out ? 'vb-counter is-out' : 'vb-counter'}>{position}</p>
      <p className="vb-secret-tag" style={{ background: `#${category.category.color}` }}>
        {category.category.name}
      </p>

      <section className="vb-section is-first">
        <h2 className="vb-detail-title">{secret.headline}</h2>
        <div className="vb-section-body is-padded">
          <SafeImg className="vb-secret-image" path={secret.image} />
          <p className="vb-text">{secret.body}</p>
        </div>
      </section>

      <section className="vb-section">
        <h3 className="vb-section-tab">Why It Works</h3>
        <div className="vb-section-body is-padded">
          <p className="vb-text">{secret.whyItWorks}</p>
        </div>
      </section>

      {hasExtras && (
        <section className="vb-section">
          <h3 className="vb-section-tab">Additional Information</h3>
          <div className="vb-section-body">
            <ul className="vb-links">
              {planner && (
                <li>
                  <a href={planner} target="_blank" rel="noopener noreferrer">
                    Printable planner (PDF)
                  </a>
                </li>
              )}
              {secret.links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  )
}
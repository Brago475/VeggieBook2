import { SECRETS } from '../../i18n/strings/secrets'
import { useStrings } from '../../i18n/useStrings'
import type { Secret } from '../../types'
import { safeWebUrl } from '../../utils/safeUrl'
import { RichText } from '../common/RichText'
import { SafeImage } from '../common/SafeImage'

// One secret, as the review step and a saved Secrets Book show it. Matches
// the original app's secret page (templates/secret_mobile_en.html in the
// original backend):
//
//   the category, on the category's own color
//   the headline
//   the illustration, then the secret itself
//   Why It Works
//   Additional Information, only when the secret has links or a planner
//
// During review, "Secret 1 of 18" sits at the top in the recipe review's
// own pill (.recipe-counter), so both reviews count the same way. Labels
// follow the site language; the secret text comes from the API in it.
//
// The illustrations have words drawn into them, so they are shown whole,
// never cropped.
//
// Links open only when they are http or https; anything else shows as text.

type Props = {
  secret: Secret
  categoryName: string
  // Hex without the leading #, as the API sends it.
  categoryColor: string
  // The review's count. Left out when reading a saved book, where there is
  // no count to keep.
  position?: number
  total?: number
}

export function SecretCard({
  secret,
  categoryName,
  categoryColor,
  position,
  total,
}: Props) {
  const t = useStrings(SECRETS)
  const hasExtras = secret.links.length > 0 || Boolean(secret.attachment)
  const planner = secret.attachment ? `/images/${secret.attachment}` : null
  const counting = position !== undefined && total !== undefined

  return (
    <article className="secret-card">
      {counting && <p className="recipe-counter">{t.counter(position, total)}</p>}

      <p className="secret-tag" style={{ background: `#${categoryColor}` }}>
        {categoryName}
      </p>

      <section className="secret-section">
        <h2 className="secret-headline">{secret.headline}</h2>
        <div className="secret-section-body">
          <SafeImage
            className="secret-image"
            src={secret.image ? `/images/${secret.image}` : null}
            alt=""
            loading="eager"
          />
          <p className="secret-text">
            <RichText text={secret.body} />
          </p>
        </div>
      </section>

      <section className="secret-section">
        <h3 className="secret-section-title">{t.whyItWorks}</h3>
        <div className="secret-section-body">
          <p className="secret-text">
            <RichText text={secret.whyItWorks} />
          </p>
        </div>
      </section>

      {hasExtras && (
        <section className="secret-section">
          <h3 className="secret-section-title">{t.additional}</h3>
          <div className="secret-section-body">
            <ul className="secret-links">
              {planner && (
                <li>
                  <a href={planner} target="_blank" rel="noopener noreferrer">{t.planner}</a>
                </li>
              )}
              {secret.links.map((link) => {
                const href = safeWebUrl(link.url)
                const text = link.label || link.url
                return (
                  <li key={link.url}>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer">{text}</a>
                    ) : (
                      text
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}
    </article>
  )
}
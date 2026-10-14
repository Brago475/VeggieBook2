import type { ReactNode } from 'react'
import { SafeImage } from '../common/SafeImage'
import { RECIPE } from '../../i18n/strings/recipe'
import { useStrings } from '../../i18n/useStrings'
import type { RecipeDetail } from '../../types'
import { coverSrc } from '../../utils/coverSrc'

// The body of one recipe: Ingredients, Summary, Instructions, Notes, and
// Photos, each in a green outlined box with a tab label, as the original
// app showed them. Labels follow the site language; the recipe text comes
// from the API in the same language.
//
// Used by both the review step (RecipeCard) and a saved book
// (BookViewer), so a recipe looks the same whether it is being chosen or
// read, and a change here lands in both places.
//
// The page shows the recipe's first photo large at the top. Photos at the
// bottom holds the rest, in the order the original stored them. About 33
// recipes have more than one: preparation shots or progress steps. Before
// this component, only the first photo was ever shown.

type Props = {
  detail: RecipeDetail
  // The photo already shown at the top of the page, left out of Photos so
  // it does not appear twice. Null when the top shows no photo.
  topPhoto: string | null
}

export function RecipeSections({ detail, topPhoto }: Props) {
  const t = useStrings(RECIPE)
  const extraPhotos = withoutFirst(detail.photos, topPhoto)

  return (
    <>
      <Section label={t.ingredients}>
        <ul className="recipe-list">
          {detail.ingredients.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </Section>

      <Section label={t.summary}>
        <div className="recipe-summary">
          <span className="recipe-summary-key">{t.prepTime}</span>
          <span className="recipe-summary-val">{detail.timeToPrepare}</span>
          <span className="recipe-summary-key">{t.madeAhead}</span>
          <span className="recipe-summary-val">{detail.canBeMadeAhead}</span>

          <span className="recipe-summary-key">{t.cookTime}</span>
          <span className="recipe-summary-val">{detail.timeToCook}</span>
          <span className="recipe-summary-key">{t.frozen}</span>
          <span className="recipe-summary-val">{detail.canBeFrozen}</span>

          <span className="recipe-summary-key">{t.servings}</span>
          <span className="recipe-summary-val">{detail.servings}</span>
          <span className="recipe-summary-key">{t.leftovers}</span>
          <span className="recipe-summary-val">{detail.goodForLeftovers}</span>
        </div>
      </Section>

      <Section label={t.instructions}>
        <ol className="recipe-list recipe-steps">
          {detail.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </Section>

      {detail.notes.length > 0 && (
        <Section label={t.notes}>
          <ul className="recipe-list">
            {detail.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </Section>
      )}

      {extraPhotos.length > 0 && (
        <Section label={t.photos}>
          <div className="recipe-photos">
            {extraPhotos.map((path, i) => {
              const step = prepStep(path)
              return (
                <figure key={`${i}-${path}`} className="recipe-photos-item">
                  <SafeImage className="recipe-photos-img" src={coverSrc(path)} />
                  {step && (
                    <figcaption className="recipe-photos-caption">
                      {t.prepStep(step)}
                    </figcaption>
                  )}
                </figure>
              )
            })}
          </div>
        </Section>
      )}
    </>
  )
}

// One outlined box. The label is a real heading so screen readers can jump
// between sections, styled as the green tab sitting on the box's top edge.
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="recipe-section">
      <h3 className="recipe-section-tab">{label}</h3>
      <div className="recipe-section-body">{children}</div>
    </section>
  )
}

// Removes only the first match, so a path that is (unusually) stored
// twice still shows its second copy.
function withoutFirst(photos: string[], top: string | null): string[] {
  if (!top) return photos
  const i = photos.indexOf(top)
  return i === -1 ? photos : [...photos.slice(0, i), ...photos.slice(i + 1)]
}

// The database stores no captions, only file paths. The original named
// preparation shots with "prep" and a number (Cabbage-5-2012-prep1.jpg),
// so that number is the one caption that can be read honestly. Any other
// photo gets no caption rather than an invented one.
function prepStep(path: string): string | null {
  const match = /prep(\d+)/i.exec(path)
  return match ? match[1] : null
}
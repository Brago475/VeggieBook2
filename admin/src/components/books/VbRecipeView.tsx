import type { ReactNode } from 'react'
import { useVbRecipe } from '../../hooks/useBookContent'
import { SafeImg } from './SafeImg'

// One recipe, laid out the way the app shows it inside a saved book
// (web/src/pages/BookViewer.tsx with components/veggie/RecipeSections.tsx):
// the title in green, the first photo large, then Ingredients, Summary,
// Instructions, Notes, and any other photos, each in a green outlined box
// with a tab on its top edge.
//
// Loaded from the same public /api/recipes/{id} the app uses, so it reads
// exactly as the person saw it.

type Props = {
  id: number
  position: string // "Recipe 3 of 14", or "Taken out"
  out: boolean
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="vb-section">
      <h3 className="vb-section-tab">{label}</h3>
      <div className="vb-section-body">{children}</div>
    </section>
  )
}

// The original named preparation shots with "prep" and a number.
function photoLabel(path: string): string | null {
  const match = /prep(\d+)/i.exec(path)
  return match ? `Preparation step ${match[1]}` : null
}

export function VbRecipeView({ id, position, out }: Props) {
  const { recipe, error, loading } = useVbRecipe(id)

  if (loading) return <p className="vb-message">Loading the recipe...</p>
  if (!recipe) return <p className="vb-message">{error ?? 'This recipe could not be loaded.'}</p>

  const [top, ...more] = recipe.photos
  const notes = recipe.notes ?? []

  return (
    <article className="vb-detail">
      <p className={out ? 'vb-counter is-out' : 'vb-counter'}>{position}</p>
      <h2 className="vb-detail-title">{recipe.title}</h2>
      {top && <SafeImg className="vb-photo" path={top} />}

      <Section label="Ingredients">
        <ul className="vb-list">
          {recipe.ingredients.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </Section>

      <Section label="Summary">
        <div className="vb-summary">
          <span className="vb-summary-key">Preparation Time:</span>
          <span className="vb-summary-val">{recipe.timeToPrepare}</span>
          <span className="vb-summary-key">Can be made ahead:</span>
          <span className="vb-summary-val">{recipe.canBeMadeAhead}</span>

          <span className="vb-summary-key">Cooking Time:</span>
          <span className="vb-summary-val">{recipe.timeToCook}</span>
          <span className="vb-summary-key">Can be frozen:</span>
          <span className="vb-summary-val">{recipe.canBeFrozen}</span>

          <span className="vb-summary-key">Servings:</span>
          <span className="vb-summary-val">{recipe.servings}</span>
          <span className="vb-summary-key">Good for leftovers:</span>
          <span className="vb-summary-val">{recipe.goodForLeftovers}</span>
        </div>
      </Section>

      <Section label="Instructions">
        <ol className="vb-list vb-steps">
          {recipe.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </Section>

      {notes.length > 0 && (
        <Section label="Notes">
          <ul className="vb-list">
            {notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </Section>
      )}

      {more.length > 0 && (
        <Section label="Photos">
          <div className="vb-photos">
            {more.map((path, i) => {
              const label = photoLabel(path)
              return (
                <figure key={`${i}-${path}`}>
                  <SafeImg className="vb-photos-img" path={path} />
                  {label && <figcaption>{label}</figcaption>}
                </figure>
              )
            })}
          </div>
        </Section>
      )}
    </article>
  )
}
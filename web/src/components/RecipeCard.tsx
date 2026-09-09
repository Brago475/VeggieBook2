import { useRecipeDetail } from '../hooks/useRecipeDetail'
import type { RecipeSummary } from '../types'

// One recipe in the review flow.
//
// The match response carries the title, photo, and badges, so those render
// immediately. Ingredients, steps, and the full summary come from
// /api/recipes/{id} and fill in when that resolves.
//
// Badge colors arrive as bare hex without the leading #, which is why it is
// added here. They carry the original app's palette.

type Props = {
  recipe: RecipeSummary
  position: number
  total: number
}

export function RecipeCard({ recipe, position, total }: Props) {
  const { detail, error } = useRecipeDetail(recipe.id)

  return (
    <div className="recipe">

              <p className="recipe-counter">
        Recipe {position} of {total}
      </p>

      {recipe.badges.length > 0 && (
        <div className="recipe-badges">
          {recipe.badges.map((badge) => (
            <span
              key={badge.text}
              className="recipe-badge"
              style={{ backgroundColor: `#${badge.color}` }}
            >
              {badge.text}
            </span>
          ))}
        </div>
      )}

      <h2 className="recipe-title">{recipe.title}</h2>

      <div className="recipe-photo-frame">
        <img className="recipe-photo" src={`/images/${recipe.photo}`} alt="" />
      </div>

        {error && <p className="message">Could not load details: {error}</p>}

      {/* Skeleton placeholders while the detail fetch is in flight, sized to
          roughly match the real sections so the card does not jump when the
          content arrives. */}
      {!detail && !error && (
        <div className="recipe-loading" aria-live="polite">
          <span className="visually-hidden">Loading recipe details</span>
          <div className="skeleton skeleton-tab" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-tab" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      )}

      {detail && (
        <>
          <div className="recipe-section">
            <span className="recipe-section-tab">Ingredients</span>
            <ul className="recipe-list">
              {detail.ingredients.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="recipe-section">
            <span className="recipe-section-tab">Summary</span>
            <div className="recipe-summary">
              <span className="recipe-summary-key">Preparation Time:</span>
              <span className="recipe-summary-val">{detail.timeToPrepare}</span>
              <span className="recipe-summary-key">Can be made ahead:</span>
              <span className="recipe-summary-val">{detail.canBeMadeAhead}</span>

              <span className="recipe-summary-key">Cooking Time:</span>
              <span className="recipe-summary-val">{detail.timeToCook}</span>
              <span className="recipe-summary-key">Can be frozen:</span>
              <span className="recipe-summary-val">{detail.canBeFrozen}</span>

              <span className="recipe-summary-key">Servings:</span>
              <span className="recipe-summary-val">{detail.servings}</span>
              <span className="recipe-summary-key">Good for leftovers:</span>
              <span className="recipe-summary-val">
                {detail.goodForLeftovers}
              </span>
            </div>
          </div>

          <div className="recipe-section">
            <span className="recipe-section-tab">Instructions</span>
            <ol className="recipe-list recipe-steps">
              {detail.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          {detail.notes.length > 0 && (
            <div className="recipe-section">
              <span className="recipe-section-tab">Notes</span>
              <ul className="recipe-list">
                {detail.notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}


    </div>
  )
}
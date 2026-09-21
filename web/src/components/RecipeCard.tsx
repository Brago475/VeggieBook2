import { RecipeSections } from './RecipeSections'
import { SafeImage } from './SafeImage'
import { useRecipeDetail } from '../hooks/useRecipeDetail'
import type { RecipeSummary } from '../types'
import { coverSrc } from '../utils/coverSrc'

// One recipe in the review flow.
//
// The match response carries the title, photo, and badges, so those render
// immediately. Ingredients, steps, the full summary, and any extra photos
// come from /api/recipes/{id} and fill in when that resolves.
//
// The sections themselves (Ingredients through Photos) are drawn by
// RecipeSections, the same component a saved book uses.
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

  // The match response sends the first photo, or null if the recipe has
  // none, even though the type says string.
  const topPhoto = recipe.photo || null

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

      {/* Through SafeImage and coverSrc rather than a hand-built /images/
          path: a missing photo used to collapse this frame to nothing,
          silently, because the img had no alt text and no fixed height. */}
      <div className="recipe-photo-frame">
        <SafeImage
          className="recipe-photo"
          src={topPhoto ? coverSrc(topPhoto) : null}
        />
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

      {detail && <RecipeSections detail={detail} topPhoto={topPhoto} />}
    </div>
  )
}
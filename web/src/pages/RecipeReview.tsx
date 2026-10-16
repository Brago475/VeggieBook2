import { useLayoutEffect } from 'react'
import { RecipeCard } from '../components/veggie/RecipeCard'
import { FLOW } from '../i18n/strings/flow'
import { useStrings } from '../i18n/useStrings'
import type { RecipeSummary } from '../types'
import '../styles/review.css'

// Keep/Drop review, one recipe at a time. Position and kept recipes live in useBookFlow.

type Props = {
  recipes: RecipeSummary[]
  index: number
  onDecide: (keep: boolean) => void
}

export function RecipeReview({ recipes, index, onDecide }: Props) {
  const t = useStrings(FLOW)
  const recipe = recipes[index]

  // Each recipe opens at the top. Runs before paint so the old position never shows.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [index])

  if (!recipe) {
    return <p className="message">{t.noMatches}</p>
  }

  return (
    <div className="review">
      {/* Keyed so each recipe mounts fresh. */}
      <RecipeCard
        key={recipe.id}
        recipe={recipe}
        position={index + 1}
        total={recipes.length}
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
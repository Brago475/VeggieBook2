import { useLayoutEffect } from 'react'
import { RecipeCard } from '../components/RecipeCard'
import type { RecipeSummary } from '../types'

// The KEEP / DROP flow. One recipe at a time; kept ones become the book.
//
// Which recipe is showing, and what has been kept so far, live in
// useBookFlow rather than here, so they are saved with the rest of the
// book in progress and a refresh returns to the same recipe.

type Props = {
  recipes: RecipeSummary[]
  index: number
  onDecide: (keep: boolean) => void
}

export function RecipeReview({ recipes, index, onDecide }: Props) {
  const recipe = recipes[index]

  // KEEP and DROP sit at the bottom of a long recipe, so without this the
  // next recipe opened wherever the last one was scrolled to, often at its
  // end. A layout effect runs before the browser paints, so the new recipe
  // is never seen at the old position, not even for a frame.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [index])

  if (!recipe) {
    return <p className="message">No recipes matched your choices.</p>
  }

  return (
    <>
      {/* Keyed by recipe so each one mounts fresh: nothing from the
          previous card, its photo or its loaded content, carries over. */}
      <RecipeCard
        key={recipe.id}
        recipe={recipe}
        position={index + 1}
        total={recipes.length}
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
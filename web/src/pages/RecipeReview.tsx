import { useLayoutEffect, useState } from 'react'
import { RecipeCard } from '../components/RecipeCard'
import type { RecipeSummary } from '../types'

// The KEEP / DROP flow. One recipe at a time; kept ones become the book.
//
// Both buttons advance, they differ only in whether the recipe is recorded.
// When the last card is answered, onFinish receives the kept recipes.

type Props = {
  recipes: RecipeSummary[]
  onFinish: (kept: RecipeSummary[]) => void
}

export function RecipeReview({ recipes, onFinish }: Props) {
  const [index, setIndex] = useState(0)
  const [kept, setKept] = useState<RecipeSummary[]>([])

  const recipe = recipes[index]

  // KEEP and DROP sit at the bottom of a long recipe, so without this the
  // next recipe opened wherever the last one was scrolled to, often at its
  // end. A layout effect runs before the browser paints, so the new recipe
  // is never seen at the old position, not even for a frame.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [index])

  function decide(keep: boolean) {
    const nextKept = keep ? [...kept, recipe] : kept
    setKept(nextKept)

    if (index === recipes.length - 1) {
      onFinish(nextKept)
      return
    }
    setIndex(index + 1)
  }

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
        <button
          type="button"
          className="decide-btn"
          onClick={() => decide(true)}
        >
          KEEP
        </button>
        <button
          type="button"
          className="decide-btn"
          onClick={() => decide(false)}
        >
          DROP
        </button>
      </div>
    </>
  )
}
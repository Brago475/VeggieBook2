import { useState } from 'react'
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
      <RecipeCard
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
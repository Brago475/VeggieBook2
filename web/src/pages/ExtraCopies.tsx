import { useState } from 'react'
import { NavBar } from '../components/NavBar'
import { SafeImage } from '../components/SafeImage'
import type { RecipeSummary } from '../types'

// After the review, users mark any kept recipes they want an extra printed
// copy of. Selection is recorded and passed along; printing itself is not
// part of the web app.
//
// Each tile's photo goes through SafeImage. A recipe with no photo passes
// null, which SafeImage skips straight to the VeggieBook mark, rather than
// requesting /images/null and showing a broken-image icon.

type Props = {
  recipes: RecipeSummary[]
  onNext: (extraCopyIds: number[]) => void
}

export function ExtraCopies({ recipes, onNext }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set())

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <div className="intro-text">
        <p>
          You can print an EXTRA COPY of any recipe to give to family or
          friends.
        </p>
        <p>Just touch a recipe for an EXTRA COPY.</p>
      </div>

      <ul className="copy-grid">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <button
              type="button"
              className="copy-tile"
              onClick={() => toggle(recipe.id)}
              aria-pressed={selected.has(recipe.id)}
            >
              <SafeImage
                className="copy-tile-img"
                src={recipe.photo ? `/images/${recipe.photo}` : null}
              />
              <span className="copy-tile-title">{recipe.title}</span>
              <span
                className={
                  selected.has(recipe.id)
                    ? 'copy-tile-box is-checked'
                    : 'copy-tile-box'
                }
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>

      <NavBar primaryLabel="NEXT" onPrimary={() => onNext([...selected])} />
    </>
  )
}
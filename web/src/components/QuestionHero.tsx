import type { Vegetable } from '../types'

// The vegetable photo banner shown above every question, with the name
// overlaid at the bottom left. Matches the original app's question screens.

type Props = {
  vegetable: Vegetable
}

export function QuestionHero({ vegetable }: Props) {
  return (
    <div className="hero">
      <img
        className="hero-img"
        src={`/images/${vegetable.image}`}
        alt=""
      />
      <p className="hero-name">{vegetable.name}</p>
    </div>
  )
}
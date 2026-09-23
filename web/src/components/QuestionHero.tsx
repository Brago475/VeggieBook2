import type { Vegetable } from '../types'
import { SafeImage } from './SafeImage'

// The vegetable photo banner shown above every question, with the name
// overlaid at the bottom left. Matches the original app's question screens.
//
// SafeImage, so a photo that fails to load shows the VeggieBook mark on
// green instead of a broken-image icon. eager because it is the first thing
// on the screen.

type Props = {
  vegetable: Vegetable
}

export function QuestionHero({ vegetable }: Props) {
  return (
    <div className="hero">
      <SafeImage
        className="hero-img"
        src={`/images/${vegetable.image}`}
        loading="eager"
      />
      <p className="hero-name">{vegetable.name}</p>
    </div>
  )
}
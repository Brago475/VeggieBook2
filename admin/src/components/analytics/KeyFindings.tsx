import type { AnalyticsData } from '../../types/analytics'
import { percent } from '../../utils/math'
import { fillVegetable } from '../../utils/text'
import { NumberCard } from '../common/NumberCard'

// Six number cards with the main points, always six so the grid stays even.
// A card with no data behind it yet shows "n/a". Hidden questions (never
// shown to users) are left out.

type Props = {
  data: AnalyticsData
}

export function KeyFindings({ data }: Props) {
  const s = data.summary
  const totalBooks = s.veggieBooks + s.secretsBooks

  const topVeg = data.vegetables[0]
  const hasVeg = topVeg !== undefined && topVeg.books > 0

  const topAnswer = data.questions
    .filter((q) => !q.hidden)
    .flatMap((q) => q.choices)
    .sort((a, b) => b.count - a.count)[0]
  const hasAnswer = topAnswer !== undefined && topAnswer.count > 0

  const recipes = data.descriptives.find((d) => d.variable === 'Recipes per VeggieBook')
  const topCategory = data.secretCategories[0]
  const hasCategory = topCategory !== undefined && topCategory.books > 0

  const cards = [
    {
      value: hasVeg ? `${percent(topVeg.books, s.veggieBooks)}%` : 'n/a',
      label: hasVeg ? `${topVeg.name} picked` : 'Top vegetable',
    },
    {
      value: hasAnswer ? `${topAnswer.percent}%` : 'n/a',
      label: hasAnswer ? fillVegetable(topAnswer.text) : 'Top answer',
    },
    {
      value: recipes && recipes.mean !== null ? recipes.mean.toFixed(1) : 'n/a',
      label: 'Recipes per book',
    },
    {
      value: totalBooks > 0 ? `${percent(s.personalCovers, totalBooks)}%` : 'n/a',
      label: 'Personal covers',
    },
    {
      value: totalBooks > 0 ? `${percent(s.spanishBooks, totalBooks)}%` : 'n/a',
      label: 'Spanish books',
    },
    {
      value: hasCategory ? '#1' : 'n/a',
      label: hasCategory ? topCategory.name : 'Top Secrets category',
    },
  ]

  return (
    <div className="card-grid cols-3">
      {cards.map((c, i) => (
        <NumberCard key={i} value={c.value} label={c.label} />
      ))}
    </div>
  )
}
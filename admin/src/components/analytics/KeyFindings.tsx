import type { AnalyticsData } from '../../types/analytics'
import { percent } from '../../utils/math'

// Plain sentences written from the real numbers, so the main points can be
// read at a glance. Each sentence appears only when there is data behind it.

type Props = {
  data: AnalyticsData
}

function buildFindings(data: AnalyticsData): string[] {
  const s = data.summary
  const totalBooks = s.veggieBooks + s.secretsBooks
  const findings: string[] = []

  const topVeg = data.vegetables[0]
  if (topVeg && topVeg.books > 0) {
    findings.push(
      `${topVeg.name} is the most picked vegetable (${topVeg.books} of ${s.veggieBooks} VeggieBooks, ${percent(topVeg.books, s.veggieBooks)}%).`,
    )
  }

  const topAnswer = data.questions
    .flatMap((q) => q.choices)
    .sort((a, b) => b.count - a.count)[0]
  if (topAnswer && topAnswer.count > 0) {
    findings.push(
      `"${topAnswer.text}" is the most picked answer, chosen in ${topAnswer.percent}% of VeggieBooks.`,
    )
  }

  const recipes = data.descriptives.find((d) => d.variable === 'Recipes per VeggieBook')
  if (recipes && recipes.mean !== null) {
    findings.push(
      `A VeggieBook keeps ${recipes.mean.toFixed(1)} recipes on average (median ${recipes.median}).`,
    )
  }

  if (s.recipesRemoved > 0) {
    findings.push(
      `${s.recipesRemoved} recipes were taken out of saved books later, out of ${s.recipesKept + s.recipesRemoved} saved.`,
    )
  }

  if (totalBooks > 0) {
    findings.push(
      `${percent(s.personalCovers, totalBooks)}% of books use a personal cover photo, and ${percent(s.spanishBooks, totalBooks)}% are in Spanish.`,
    )
  }

  const topCategory = data.secretCategories[0]
  if (topCategory && topCategory.books > 0) {
    findings.push(`${topCategory.name} is the most picked Secrets category.`)
  }

  return findings
}

export function KeyFindings({ data }: Props) {
  const findings = buildFindings(data)

  if (findings.length === 0) {
    return <p className="muted">No books saved yet. Findings appear once accounts save books.</p>
  }

  return (
    <ul className="findings">
      {findings.map((f) => (
        <li key={f}>{f}</li>
      ))}
    </ul>
  )
}
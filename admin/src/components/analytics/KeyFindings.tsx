import type { AnalyticsData } from '../../types/analytics'
import { percent } from '../../utils/math'
import { fillVegetable } from '../../utils/text'
import { StatIcon, type StatIconName } from '../icons/StatIcons'

// The main points as cards: an icon, a big number, a title, and one line.
// Each card appears only when there is data behind it. Hidden questions
// (never shown to users) are left out.

type Tone = 'green' | 'gold' | 'sky' | 'rose' | 'plum'

type Finding = {
  key: string
  icon: StatIconName
  tone: Tone
  value: string
  title: string
  text: string
}

function buildFindings(data: AnalyticsData): Finding[] {
  const s = data.summary
  const totalBooks = s.veggieBooks + s.secretsBooks
  const findings: Finding[] = []

  const topVeg = data.vegetables[0]
  if (topVeg && topVeg.books > 0) {
    findings.push({
      key: 'veg',
      icon: 'leaf',
      tone: 'green',
      value: `${percent(topVeg.books, s.veggieBooks)}%`,
      title: `${topVeg.name} is most picked`,
      text: `${topVeg.books} of ${s.veggieBooks} VeggieBooks`,
    })
  }

  const topAnswer = data.questions
    .filter((q) => !q.hidden)
    .flatMap((q) => q.choices)
    .sort((a, b) => b.count - a.count)[0]
  if (topAnswer && topAnswer.count > 0) {
    findings.push({
      key: 'answer',
      icon: 'chat',
      tone: 'gold',
      value: `${topAnswer.percent}%`,
      title: fillVegetable(topAnswer.text),
      text: 'Most picked answer',
    })
  }

  const recipes = data.descriptives.find((d) => d.variable === 'Recipes per VeggieBook')
  if (recipes && recipes.mean !== null) {
    findings.push({
      key: 'recipes',
      icon: 'book',
      tone: 'sky',
      value: recipes.mean.toFixed(1),
      title: 'Recipes per VeggieBook',
      text: `Median ${recipes.median}`,
    })
  }

  if (totalBooks > 0) {
    findings.push({
      key: 'covers',
      icon: 'image',
      tone: 'rose',
      value: `${percent(s.personalCovers, totalBooks)}%`,
      title: 'Personal cover photos',
      text: `${s.personalCovers} of ${totalBooks} books`,
    })
  }

  const topCategory = data.secretCategories[0]
  if (topCategory && topCategory.books > 0) {
    findings.push({
      key: 'category',
      icon: 'sparkle',
      tone: 'plum',
      value: `${percent(topCategory.books, s.secretsBooks)}%`,
      title: topCategory.name,
      text: 'Most picked Secrets category',
    })
  }

  if (s.recipesRemoved > 0) {
    findings.push({
      key: 'removed',
      icon: 'trash',
      tone: 'gold',
      value: String(s.recipesRemoved),
      title: 'Recipes taken out later',
      text: `Out of ${s.recipesKept + s.recipesRemoved} saved`,
    })
  }

  return findings
}

type Props = {
  data: AnalyticsData
}

export function KeyFindings({ data }: Props) {
  const findings = buildFindings(data)

  if (findings.length === 0) {
    return <p className="muted">No books saved yet.</p>
  }

  return (
    <div className="findings-grid">
      {findings.map((f) => (
        <article key={f.key} className={`finding is-${f.tone}`}>
          <div className="finding-top">
            <span className="finding-icon">
              <StatIcon name={f.icon} size={22} />
            </span>
            <span className="finding-value">{f.value}</span>
          </div>
          <h3 className="finding-title">{f.title}</h3>
          <p className="finding-text">{f.text}</p>
        </article>
      ))}
    </div>
  )
}
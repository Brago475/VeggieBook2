import type { AnalyticsData, DescriptiveRow } from '../../../types/analytics'
import { Panel } from '../../common/Panel'
import { StatIcon, type StatIconName } from '../../icons/StatIcons'
import { DescriptivesTable } from '../DescriptivesTable'

// Descriptive statistics with four headline numbers, and how the numbers on
// the Analytics tabs are worked out.

type Props = {
  data: AnalyticsData
}

function find(rows: DescriptiveRow[], variable: string) {
  return rows.find((r) => r.variable === variable)
}

function value(n: number | null | undefined) {
  return n === null || n === undefined ? 'n/a' : n.toFixed(2)
}

const method: { icon: StatIconName; title: string; text: string }[] = [
  { icon: 'users', title: 'Real accounts only', text: 'Guest accounts are temporary and left out.' },
  {
    icon: 'chart',
    title: 'Standard deviation',
    text: 'The sample standard deviation (N minus 1), as in SPSS.',
  },
  {
    icon: 'chat',
    title: 'Answer percentages',
    text: 'Out of all VeggieBooks. A book can pick more than one answer.',
  },
  {
    icon: 'trash',
    title: 'Items taken out',
    text: 'Removed after saving, and still counted so that choice is kept.',
  },
  {
    icon: 'flask',
    title: 'Statistical tests',
    text: 'Tests such as p-values are added per study once the IRB is approved.',
  },
]

export function StatisticsTab({ data }: Props) {
  const rows = data.descriptives
  const recipes = find(rows, 'Recipes per VeggieBook')
  const answers = find(rows, 'Answers per VeggieBook')
  const perAccount = find(rows, 'Books per account')

  const headline: { icon: StatIconName; label: string; value: string }[] = [
    { icon: 'book', label: 'Mean recipes per VeggieBook', value: value(recipes?.mean) },
    { icon: 'target', label: 'Median recipes per VeggieBook', value: value(recipes?.median) },
    { icon: 'chat', label: 'Mean answers per VeggieBook', value: value(answers?.mean) },
    { icon: 'users', label: 'Mean books per account', value: value(perAccount?.mean) },
  ]

  return (
    <>
      <div className="kpi-grid">
        {headline.map((h) => (
          <div key={h.label} className="card kpi">
            <span className="kpi-icon">
              <StatIcon name={h.icon} size={24} />
            </span>
            <div className="kpi-text">
              <span className="kpi-value">{h.value}</span>
              <span className="kpi-label">{h.label}</span>
            </div>
          </div>
        ))}
      </div>

      <Panel icon="table" title="Descriptive statistics">
        <DescriptivesTable rows={rows} />
      </Panel>

      <Panel icon="bulb" title="Method">
        <div className="method-grid">
          {method.map((m) => (
            <div key={m.title} className="method-card">
              <span className="method-icon">
                <StatIcon name={m.icon} size={20} />
              </span>
              <div>
                <h3 className="method-title">{m.title}</h3>
                <p className="method-text">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}
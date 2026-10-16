import { AllDataIcon, type AllDataIconName } from './AllDataIcons'

// The four numbers at the top of the All Data page: a round icon, the
// label, and the number under it. Each card has one of the page's four
// colors: green (VeggieBooks, kept), violet (Secrets Books), blue (people
// and dates), orange (taken out).

export type CardTone = 'green' | 'violet' | 'blue' | 'orange'

export type AllDataCard = {
  label: string
  value: string
  icon: AllDataIconName
  tone: CardTone
  note?: string
  warn?: boolean
}

type Props = {
  cards: AllDataCard[]
}

export function AllDataCards({ cards }: Props) {
  return (
    <div className="vbd-cards">
      {cards.map((c) => (
        <div key={c.label} className={`vbd-card is-${c.tone}`}>
          <span className="vbd-card-icon">
            <AllDataIcon name={c.icon} size={22} />
          </span>
          <div className="vbd-card-text">
            <span className="vbd-card-label">{c.label}</span>
            <span className="vbd-card-line">
              <span className={c.warn ? 'vbd-card-value is-warn' : 'vbd-card-value'}>{c.value}</span>
              {c.note && <span className="vbd-card-note">{c.note}</span>}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
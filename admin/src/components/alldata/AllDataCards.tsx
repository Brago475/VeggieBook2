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
    <div className="ad-cards">
      {cards.map((c) => (
        <div key={c.label} className={`ad-card is-${c.tone}`}>
          <span className="ad-card-icon">
            <AllDataIcon name={c.icon} size={22} />
          </span>
          <div className="ad-card-text">
            <span className="ad-card-label">{c.label}</span>
            <span className="ad-card-line">
              <span className={c.warn ? 'ad-card-value is-warn' : 'ad-card-value'}>{c.value}</span>
              {c.note && <span className="ad-card-note">{c.note}</span>}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
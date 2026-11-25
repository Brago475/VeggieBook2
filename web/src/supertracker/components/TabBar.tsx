import { useStrings } from '../../i18n/useStrings'
import { ST_LOOKUP } from '../strings/lookup'
import { ST_TODAY } from '../strings/today'

// SuperTracker2 sections. More tabs join as screens are built.

export type Tab = 'today' | 'lookup' | 'plan'

type Props = {
  value: Tab
  onChange: (tab: Tab) => void
}

export function TabBar({ value, onChange }: Props) {
  const t = useStrings(ST_TODAY)
  const l = useStrings(ST_LOOKUP)
  const tabs: [Tab, string][] = [
    ['today', t.tabToday],
    ['lookup', l.tab],
    ['plan', t.tabPlan],
  ]

  return (
    <nav className="st2-tabs" aria-label={t.tabs}>
      {tabs.map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={`st2-tab${value === key ? ' is-on' : ''}`}
          aria-current={value === key ? 'page' : undefined}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
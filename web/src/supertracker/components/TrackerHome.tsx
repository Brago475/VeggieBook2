import { useState } from 'react'
import { useStrings } from '../../i18n/useStrings'
import type { Meal } from '../api/foodLogApi'
import type { Plan, Profile } from '../api/superTrackerApi'
import { useDay } from '../hooks/useDay'
import { ST_TRACKER } from '../strings/tracker'
import { dayLabel, todayKey } from '../utils/dates'
import { AddFood } from './AddFood'
import { AddVegetables } from './AddVegetables'
import { MyPlan } from './MyPlan'
import { TabBar, type Tab } from './TabBar'
import { Today } from './Today'
import '../styles/today.css'
import '../styles/tools.css'

// SuperTracker2 after setup: the day view and My plan tabs, Add food, and
// the quick vegetables shortcut, for the day being viewed.

type Props = {
  profile: Profile
  plan: Plan
  onEdit: () => void
}

type Screen = { kind: 'home' } | { kind: 'food'; meal: Meal } | { kind: 'vegetables' }

export function TrackerHome({ profile, plan, onEdit }: Props) {
  const t = useStrings(ST_TRACKER)
  const [tab, setTab] = useState<Tab>('today')
  const [screen, setScreen] = useState<Screen>({ kind: 'home' })
  const [date, setDate] = useState(() => todayKey())
  const day = useDay(date)
  const home = () => setScreen({ kind: 'home' })
  const dayName = dayLabel(date, t.locale, { today: t.today, yesterday: t.yesterday }).toLowerCase()

  if (screen.kind === 'food') {
    return (
      <AddFood
        date={date}
        dayName={dayName}
        initialMeal={screen.meal}
        onAdded={() => void day.reload()}
        onDone={home}
      />
    )
  }

  if (screen.kind === 'vegetables') {
    return (
      <AddVegetables
        date={date}
        plan={plan}
        totals={day.day?.totals ?? null}
        onAdded={() => void day.reload()}
        onDone={home}
      />
    )
  }

  return (
    <div className="st2-home">
      <TabBar value={tab} onChange={setTab} />
      {tab === 'today' ? (
        <Today
          date={date}
          plan={plan}
          day={day.day}
          error={day.error}
          onDateChange={setDate}
          onRetry={() => void day.reload()}
          onChanged={() => void day.reload()}
          onAddFood={(meal) => setScreen({ kind: 'food', meal })}
          onQuickVegetables={() => setScreen({ kind: 'vegetables' })}
          onRemove={(id) => void day.remove(id)}
        />
      ) : (
        <MyPlan profile={profile} plan={plan} onEdit={onEdit} />
      )}
    </div>
  )
}
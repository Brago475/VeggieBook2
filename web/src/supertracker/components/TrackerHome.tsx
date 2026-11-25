import { useState } from 'react'
import { useStrings } from '../../i18n/useStrings'
import type { DayEntry, Meal } from '../api/foodLogApi'
import type { Plan, Profile } from '../api/superTrackerApi'
import { useDay } from '../hooks/useDay'
import { ST_TRACKER } from '../strings/tracker'
import { dayLabel, todayKey } from '../utils/dates'
import { AddFood } from './AddFood'
import { AddVegetables } from './AddVegetables'
import { EditEntry } from './EditEntry'
import { FoodLookup } from './FoodLookup'
import { MyPlan } from './MyPlan'
import { TabBar, type Tab } from './TabBar'
import { Today } from './Today'
import '../styles/today.css'
import '../styles/tools.css'
import '../styles/combos.css'
import '../styles/lookup.css'

// SuperTracker2 after setup: the Today, Look up and My plan tabs, Add food,
// Edit food and the quick vegetables shortcut, for the day being viewed.

type Props = {
  profile: Profile
  plan: Plan
  onEdit: () => void
}

type Screen =
  | { kind: 'home' }
  | { kind: 'food'; meal: Meal }
  | { kind: 'vegetables' }
  | { kind: 'edit'; entry: DayEntry }

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

  if (screen.kind === 'edit') {
    return (
      <EditEntry
        key={screen.entry.id}
        entry={screen.entry}
        onSaved={() => {
          void day.reload()
          home()
        }}
        onCancel={home}
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
          onEdit={(entry) => setScreen({ kind: 'edit', entry })}
        />
      ) : tab === 'lookup' ? (
        <FoodLookup date={date} dayName={dayName} onAdded={() => void day.reload()} />
      ) : (
        <MyPlan profile={profile} plan={plan} onEdit={onEdit} />
      )}
    </div>
  )
}
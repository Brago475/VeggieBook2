import { useState } from 'react'
import type { Plan, Profile } from '../api/superTrackerApi'
import { useDay } from '../hooks/useDay'
import { todayKey } from '../utils/dates'
import { AddVegetables } from './AddVegetables'
import { MyPlan } from './MyPlan'
import { TabBar, type Tab } from './TabBar'
import { Today } from './Today'
import '../styles/today.css'

// SuperTracker2 after setup: the Today and My plan tabs, and Add vegetables.

type Props = {
  profile: Profile
  plan: Plan
  onEdit: () => void
}

export function TrackerHome({ profile, plan, onEdit }: Props) {
  const [tab, setTab] = useState<Tab>('today')
  const [adding, setAdding] = useState(false)
  const [date] = useState(() => todayKey())
  const day = useDay(date)

  if (adding) {
    return (
      <AddVegetables
        date={date}
        plan={plan}
        totals={day.day?.totals ?? null}
        onAdded={() => void day.reload()}
        onDone={() => setAdding(false)}
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
          onRetry={() => void day.reload()}
          onAdd={() => setAdding(true)}
          onRemove={(id) => void day.remove(id)}
        />
      ) : (
        <MyPlan profile={profile} plan={plan} onEdit={onEdit} />
      )}
    </div>
  )
}
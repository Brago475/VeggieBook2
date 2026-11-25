import { useState } from 'react'
import { useStrings } from '../../i18n/useStrings'
import { AccountRequired } from '../components/AccountRequired'
import { MyPlan } from '../components/MyPlan'
import { SetupForm } from '../components/SetupForm'
import { WelcomeScreen } from '../components/WelcomeScreen'
import { LOCKED } from '../config'
import { useSuperTracker } from '../hooks/useSuperTracker'
import { ST_SETUP } from '../strings/setup'
import '../styles/supertracker.css'

// SuperTracker2 entry, opened from the VeggieBook menu. Guests see the
// account screen; accounts see Welcome, then Setup, then My plan.

export function SuperTrackerWelcome() {
  const t = useStrings(ST_SETUP)
  const { state, reload, save } = useSuperTracker()
  const [editing, setEditing] = useState(false)

  function body() {
    if (state.status === 'loading') return <p className="st2-soon">{t.loading}</p>
    if (state.status === 'guest') return <AccountRequired />
    if (state.status === 'error') {
      return (
        <section className="st2-panel">
          <p className="st2-error">{state.message || t.loadFailed}</p>
          <button type="button" className="st2-guide" onClick={() => void reload()}>
            {t.retry}
          </button>
        </section>
      )
    }

    const { profile, plan } = state.me
    if (editing) {
      return (
        <SetupForm
          initial={profile}
          onSave={async (input) => {
            await save(input)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      )
    }
    if (profile && plan) return <MyPlan profile={profile} plan={plan} onEdit={() => setEditing(true)} />
    return <WelcomeScreen onStart={() => !LOCKED && setEditing(true)} />
  }

  return <div className="st2">{body()}</div>
}
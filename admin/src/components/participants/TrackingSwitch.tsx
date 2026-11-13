import { useState } from 'react'
import type { Participant } from '../../types/participants'

// The on/off switch on a person card.
//
//   on          asks first: opens the confirm in the side panel
//   off_admin   turns tracking back on right away
//   off_self    locked: only they can turn it back on, in Settings

type Props = {
  person: Participant
  onTurnOff: () => void
  onTurnOn: () => Promise<string | null>
}

const LOCKED_NOTE = 'Only they can turn tracking back on, in Settings.'

export function TrackingSwitch({ person, onTurnOff, onTurnOn }: Props) {
  const [busy, setBusy] = useState(false)
  const on = person.status === 'on'
  const locked = person.status === 'off_self'

  async function toggle() {
    if (on) {
      onTurnOff()
      return
    }
    if (locked || busy) return
    setBusy(true)
    await onTurnOn()
    setBusy(false)
  }

  const label = busy ? '...' : on ? 'On' : locked ? 'Locked' : 'Off'
  const classes = ['pt-switch', `is-${person.status}`, on && 'is-on', locked && 'is-locked', busy && 'is-busy']
    .filter(Boolean)
    .join(' ')

  return (
    <label className={classes} title={locked ? LOCKED_NOTE : undefined}>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        disabled={locked || busy}
        aria-label={`Tracking for ${person.researchId}`}
        onChange={() => void toggle()}
      />
      <span className="pt-switch-track" aria-hidden="true">
        <span className="pt-switch-knob" />
      </span>
      <span className="pt-switch-label" aria-hidden="true">
        {label}
      </span>
    </label>
  )
}
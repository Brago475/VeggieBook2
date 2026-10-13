import { useState } from 'react'
import type { SiteSettingsInfo } from '../../types/settings'
import { api } from '../../utils/api'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { SettingsCard, SettingsRow } from './SettingsCard'
import { Switch } from './Switch'

// Guest visits: the on/off switch (any admin) and the daily counts. Guests
// are never tracked; only a number per day is kept.

type Props = {
  guests: SiteSettingsInfo['guests']
  onChanged: () => void
}

export function GuestsSection({ guests, onChanged }: Props) {
  const [confirmOff, setConfirmOff] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(allowed: boolean) {
    setBusy(true)
    setError(null)
    try {
      await api('/admin/settings/guests', { method: 'PUT', body: { allowed } })
      onChanged()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
      setConfirmOff(false)
    }
  }

  const max = Math.max(1, ...guests.daily.map((d) => d.visits))

  return (
    <SettingsCard id="guests" title="Guests">
      <SettingsRow
        label="Allow guest visits"
        help={`When off, the Guest button is hidden on the Welcome screen. Guests already inside keep their visit until they leave or ${guests.lifetimeHours} hours pass.`}
      >
        <Switch
          on={guests.allowed}
          label="Allow guest visits"
          disabled={busy}
          onChange={(on) => (on ? void save(true) : setConfirmOff(true))}
        />
      </SettingsRow>

      {error && (
        <p className="error se-pad" role="alert">
          {error}
        </p>
      )}

      <div className="se-guests">
        <div className="se-guests-head">
          <strong>Guest visits per day</strong>
          <span>A count only. Guests are never tracked.</span>
        </div>

        <div className="se-mini-stats">
          <div>
            <span>Today</span>
            <strong>{guests.today.toLocaleString()}</strong>
          </div>
          <div>
            <span>Last 7 days</span>
            <strong>{guests.last7.toLocaleString()}</strong>
          </div>
          <div>
            <span>Inside right now</span>
            <strong>{guests.insideNow.toLocaleString()}</strong>
          </div>
        </div>

        <div className="se-bars" role="img" aria-label={`Guest visits per day for the last ${guests.daily.length} days`}>
          {guests.daily.map((d) => (
            <span
              key={d.day}
              className="se-bar"
              style={{ height: `${Math.max(3, (d.visits / max) * 100)}%` }}
              title={`${d.day}: ${d.visits}`}
            />
          ))}
        </div>
        <div className="se-bars-axis">
          <span>{guests.daily.length} days ago</span>
          <span>Today</span>
        </div>

        <div className="se-guests-foot">
          <a className="se-btn" href="/api/admin/settings/guests.csv" download>
            Download daily counts (CSV)
          </a>
        </div>
      </div>

      {confirmOff && (
        <ConfirmDialog
          title="Turn off guest visits?"
          message="The Guest button will be hidden on the Welcome screen. Guests already inside keep their visit."
          confirmLabel="Turn off"
          danger
          busy={busy}
          onConfirm={() => void save(false)}
          onCancel={() => setConfirmOff(false)}
        />
      )}
    </SettingsCard>
  )
}
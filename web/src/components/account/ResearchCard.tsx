import { useEffect, useState } from 'react'
import { useHeld } from '../../hooks/useHeld'
import { ACCOUNT } from '../../i18n/strings/account'
import { COMMON } from '../../i18n/strings/common'
import { useStrings } from '../../i18n/useStrings'
import { getTracking, setTracking, type Tracking } from '../../utils/trackingApi'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { FlaskIcon } from '../icons/ResearchIcons'
import { AccountCardSkeleton, AccountTextSkeleton } from './AccountCardSkeleton'
import '../../styles/research.css'

// Help with research, on the account settings screen: whether research
// tracking is on, and one button to change it. Outlines show while it loads.
//
//   On                    a green "Tracking on" chip, the anonymous research
//                         ID, and "Turn off research tracking", which asks
//                         first (books saved before stay in the research)
//   Off (they did it)     a gray "Tracking off" chip and a big "Turn
//                         research tracking on" button
//   Off (research team)   a locked line and no button: only the team can
//                         turn it back on
//
// Admin accounts are never tracked, so they don't see this card at all.
// See api/Research/TrackingController.cs.

export function ResearchCard() {
  const t = useStrings(ACCOUNT)
  const common = useStrings(COMMON)

  const [tracking, setState] = useState<Tracking | null>(null)
  const [loadFailed, setLoadFailed] = useState<{ message: string | null } | null>(null)
  const [confirmOff, setConfirmOff] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'on' | 'off' | null>(null)

  const held = useHeld(tracking === null && loadFailed === null)
  const loadError = loadFailed ? (loadFailed.message ?? t.loadCardError) : null

  useEffect(() => {
    let cancelled = false
    getTracking()
      .then((result) => {
        if (!cancelled) setState(result)
      })
      .catch((err) => {
        if (!cancelled) setLoadFailed({ message: err instanceof Error ? err.message : null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function change(on: boolean) {
    if (busy) return
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      setState(await setTracking(on))
      setDone(on ? 'on' : 'off')
    } catch (err) {
      setError(err instanceof Error ? err.message : common.somethingWrong)
    } finally {
      setBusy(false)
      setConfirmOff(false)
    }
  }

  if (tracking !== null && !tracking.eligible) return null

  const text =
    tracking === null
      ? t.rsLoading
      : tracking.on
        ? t.rsOn
        : tracking.offByAdmin
          ? t.rsOffAdmin
          : t.rsOff

  return (
    <div className="account-card research-card" aria-busy={held}>
      <div className="account-card-head">
        <span className="account-card-icon">
          <FlaskIcon />
        </span>
        <div className="account-card-head-text">
          <h2 className="account-card-title">{t.rsTitle}</h2>
          {held ? <AccountTextSkeleton lines={2} /> : <p className="account-card-text">{text}</p>}
        </div>
      </div>

      {held && <AccountCardSkeleton chip />}

      {loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}

      {tracking?.eligible && !held && (
        <>
          {tracking.on ? (
            <span className="research-chip is-on">
              <i aria-hidden="true" />
              {t.rsChipOn}
            </span>
          ) : tracking.offByAdmin ? (
            <span className="research-chip is-locked">
              <i aria-hidden="true" />
              {t.rsChipLocked}
            </span>
          ) : (
            <span className="research-chip is-off">
              <i aria-hidden="true" />
              {t.rsChipOff}
            </span>
          )}

          {tracking.on && tracking.researchId && (
            <div className="research-id">
              <span className="research-id-label">{t.rsYourId}</span>
              <span className="research-id-code">{tracking.researchId}</span>
            </div>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {done && (
            <p className="form-success" role="status">
              {done === 'on' ? t.rsDoneOn : t.rsDoneOff}
            </p>
          )}

          {tracking.on && (
            <button type="button" className="link-btn" onClick={() => setConfirmOff(true)} disabled={busy}>
              {t.rsTurnOff}
            </button>
          )}

          {!tracking.on && !tracking.offByAdmin && (
            <button type="button" className="account-primary" onClick={() => void change(true)} disabled={busy}>
              {busy ? t.rsTurningOn : t.rsTurnOn}
            </button>
          )}

          {tracking.offByAdmin && <p className="field-hint">{t.rsAdminHint}</p>}
        </>
      )}

      <ConfirmDialog
        open={confirmOff}
        title={t.rsConfirmTitle}
        body={t.rsConfirmBody}
        confirmLabel={t.rsConfirmYes}
        cancelLabel={t.rsConfirmNo}
        danger
        busy={busy}
        onConfirm={() => void change(false)}
        onCancel={() => {
          if (!busy) setConfirmOff(false)
        }}
      />
    </div>
  )
}
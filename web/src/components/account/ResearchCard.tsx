import { useEffect, useState } from 'react'
import { getTracking, setTracking, type Tracking } from '../../utils/trackingApi'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { FlaskIcon } from '../icons/ResearchIcons'
import '../../styles/research.css'

// Help with research, on the account settings screen: whether research
// tracking is on, and one button to change it.
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
  const [tracking, setState] = useState<Tracking | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmOff, setConfirmOff] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getTracking()
      .then((t) => {
        if (!cancelled) setState(t)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load this card.')
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
      setDone(on ? 'Research tracking is on. Thank you for helping.' : 'Research tracking is off.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
      setConfirmOff(false)
    }
  }

  if (tracking !== null && !tracking.eligible) return null

  const text =
    tracking === null
      ? 'Loading...'
      : tracking.on
        ? 'Your saved books help the VeggieBook research team at Kean University. They only see an anonymous research ID, never your name or email.'
        : tracking.offByAdmin
          ? 'The research team turned research tracking off for your account. Nothing you save is used for research.'
          : 'Research tracking is off. Nothing you save from now on is used for research. You can turn it back on anytime.'

  return (
    <div className="account-card research-card">
      <div className="account-card-head">
        <span className="account-card-icon">
          <FlaskIcon />
        </span>
        <div className="account-card-head-text">
          <h2 className="account-card-title">Help with research</h2>
          <p className="account-card-text">{text}</p>
        </div>
      </div>

      {loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}

      {tracking?.eligible && (
        <>
          {tracking.on ? (
            <span className="research-chip is-on">
              <i aria-hidden="true" />
              Tracking on
            </span>
          ) : tracking.offByAdmin ? (
            <span className="research-chip is-locked">
              <i aria-hidden="true" />
              Turned off by the research team
            </span>
          ) : (
            <span className="research-chip is-off">
              <i aria-hidden="true" />
              Tracking off
            </span>
          )}

          {tracking.on && tracking.researchId && (
            <div className="research-id">
              <span className="research-id-label">Your anonymous research ID</span>
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
              {done}
            </p>
          )}

          {tracking.on && (
            <button type="button" className="link-btn" onClick={() => setConfirmOff(true)} disabled={busy}>
              Turn off research tracking
            </button>
          )}

          {!tracking.on && !tracking.offByAdmin && (
            <button type="button" className="account-primary" onClick={() => void change(true)} disabled={busy}>
              {busy ? 'Turning on...' : 'Turn research tracking on'}
            </button>
          )}

          {tracking.offByAdmin && (
            <p className="field-hint">
              Only the research team can turn it back on. Questions? Contact the research team through the About page.
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOff}
        title="Turn off research tracking?"
        body="From now on, nothing you save is used for research. Books you saved before stay part of the research. You can turn it back on anytime."
        confirmLabel="Turn it off"
        cancelLabel="Keep it on"
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
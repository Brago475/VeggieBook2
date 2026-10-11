import { useEffect, useRef, useState } from 'react'
import type { StudiesResponse } from '../../types/studies'
import { OffIdList } from './OffIdList'
import { StudyIcon } from './StudyIcons'
import { fullDate, plural } from './studyFormat'

// The study on/off switch, for the top bar, and its confirm dialog.
//
// Flipping the switch never acts right away: it opens a dialog that says
// what will happen.
//
//   Switching on    Study N starts now. Shows how many people will be
//                   tracked and the research IDs of those with tracking off
//                   (the ones who turned it off themselves get the notice).
//   Switching off   Study N ends now and nothing more is recorded until a
//                   study is switched on again (which starts Study N+1).
//
// The dialog closes on Cancel, the X, Escape, or a click outside it.

type Props = {
  data: StudiesResponse
  onSwitch: (on: boolean) => Promise<string | null>
}

export function StudySwitch({ data, onSwitch }: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const running = data.studies.find((s) => s.running) ?? null
  const turningOn = running === null

  useEffect(() => {
    if (!open) return
    dialogRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy])

  function openDialog() {
    setError(null)
    setOpen(true)
  }

  async function confirm() {
    setBusy(true)
    const message = await onSwitch(turningOn)
    setBusy(false)
    if (message) setError(message)
    else setOpen(false)
  }

  const getsNotice = data.preview.offIds.filter((p) => p.by === 'self').length

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={!turningOn}
        className={turningOn ? 'st-switch' : 'st-switch is-on'}
        onClick={openDialog}
      >
        <span className="st-switch-track" aria-hidden="true">
          <span className="st-switch-thumb" />
        </span>
        <span className="st-switch-text">{turningOn ? 'Study off' : `Study ${running!.number} on`}</span>
      </button>

      {open && (
        <div className="st-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setOpen(false)}>
          <div
            ref={dialogRef}
            className="st-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="st-dialog-title"
            tabIndex={-1}
          >
            <div className={turningOn ? 'st-dialog-head' : 'st-dialog-head is-stop'}>
              <span className="st-dialog-icon">
                <StudyIcon name={turningOn ? 'play' : 'stop'} size={20} />
              </span>
              <div className="st-dialog-title">
                <strong id="st-dialog-title">
                  {turningOn ? `Start Study ${data.nextNumber}` : `Switch off Study ${running!.number}`}
                </strong>
                <span>
                  {turningOn
                    ? `Starts right away, ${fullDate(new Date().toISOString())}`
                    : `Running ${plural(running!.days, 'day', 'days')}. Ends right away.`}
                </span>
              </div>
              <button
                type="button"
                className="st-dialog-close"
                aria-label="Close"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                <StudyIcon name="close" size={16} />
              </button>
            </div>

            <div className="st-dialog-body">
              {turningOn ? (
                <>
                  <div className="st-dialog-tiles">
                    <div className="st-tile is-green">
                      <span className="st-tile-label">
                        <StudyIcon name="signal" size={16} />
                        Tracked
                      </span>
                      <span className="st-tile-value">{data.preview.tracked.toLocaleString()}</span>
                      <span className="st-tile-note">Have tracking on. Included right away, no notice.</span>
                    </div>
                    <div className="st-tile is-orange">
                      <span className="st-tile-label">
                        <StudyIcon name="bell" size={16} />
                        Get the notice
                      </span>
                      <span className="st-tile-value">{getsNotice.toLocaleString()}</span>
                      <span className="st-tile-note">Turned tracking off. They can turn it on or stay out.</span>
                    </div>
                  </div>
                  <div className="st-dialog-section">
                    <span className="st-section-title">Tracking off</span>
                    <OffIdList people={data.preview.offIds} />
                  </div>
                </>
              ) : (
                <p className="st-dialog-text">
                  Nothing more is recorded once Study {running!.number} is off. Switching on again starts
                  Study {data.nextNumber}.
                </p>
              )}

              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}

              <div className="st-dialog-actions">
                <button type="button" className="st-button" disabled={busy} onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={turningOn ? 'st-button is-green' : 'st-button is-orange'}
                  disabled={busy}
                  onClick={() => void confirm()}
                >
                  <StudyIcon name={turningOn ? 'play' : 'stop'} size={16} />
                  {busy ? 'Working...' : turningOn ? 'Start the study' : 'Switch it off'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
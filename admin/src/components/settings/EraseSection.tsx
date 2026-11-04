import { useState } from 'react'
import type { EraseLevel, ErasePreview, EraseResult } from '../../types/erase'
import { api } from '../../utils/api'
import { SettingsCard, SettingsRow } from './SettingsCard'
import '../../styles/erase.css'

// Main admin only: erase a participant on request, by research ID. Three
// levels, each with more warnings than the last. Every erase is written to
// the activity log, which is never erased (api/Admin/ParticipantErase.cs).

type Step = 'find' | 'choose' | 'warn' | 'confirm' | 'done'

const PHRASE = 'ERASE EVERYTHING'

type Option = { level: EraseLevel; title: string; erased: string; kept: string }

const options: Option[] = [
  {
    level: 'content',
    title: 'Erase content',
    erased: 'Every book, including books still in their app. Their tracking is turned off.',
    kept: 'Account, research ID, join date, age range, terms version, tracking history, study notice answers.',
  },
  {
    level: 'account',
    title: 'Erase account',
    erased:
      'Every book, and the account: email, username, names, password, PIN and security answers. They can no longer sign in.',
    kept: 'Research ID, join date, age range, terms version, tracking history, study notice answers.',
  },
  {
    level: 'everything',
    title: 'Erase everything',
    erased:
      'Every book, the account record, tracking history, study notice answers, join date, age range and terms version. The research ID is no longer linked to anything.',
    kept: 'Only their activity log lines.',
  },
]

const count = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`

function warningsFor(level: EraseLevel, p: ErasePreview): string[] {
  const books = p.booksInApp + p.booksKept
  const list = [
    `${count(books, 'book', 'books')} will be erased for good${
      p.booksInApp > 0 ? `, including ${count(p.booksInApp, 'book', 'books')} still in their app` : ''
    }. This cannot be undone.`,
  ]
  if (level !== 'content') {
    list.push(
      p.accountDeleted
        ? 'Their account was already deleted, so there is nothing more to wipe from it.'
        : 'Their account will be deleted. They will not be able to sign in again, and their email, username, names, password, PIN and security answers will be wiped.',
    )
  }
  if (level === 'everything') {
    list.push(
      'Their tracking history, study notice answers, join date, age range and terms version will be removed, and this research ID will no longer be linked to anything. Only their activity log lines will remain.',
    )
  }
  return list
}

export function EraseSection() {
  const [step, setStep] = useState<Step>('find')
  const [lookup, setLookup] = useState('')
  const [preview, setPreview] = useState<ErasePreview | null>(null)
  const [level, setLevel] = useState<EraseLevel | null>(null)
  const [warnIndex, setWarnIndex] = useState(0)
  const [confirmId, setConfirmId] = useState('')
  const [phrase, setPhrase] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EraseResult | null>(null)

  function reset() {
    setStep('find')
    setLookup('')
    setPreview(null)
    setLevel(null)
    setWarnIndex(0)
    setConfirmId('')
    setPhrase('')
    setUnderstood(false)
    setError(null)
    setResult(null)
  }

  async function find() {
    const id = lookup.trim().toUpperCase()
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      setPreview(await api<ErasePreview>(`/admin/erase/${encodeURIComponent(id)}`))
      setLevel(null)
      setStep('choose')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function erase() {
    if (!preview || !level) return
    setBusy(true)
    setError(null)
    try {
      const r = await api<EraseResult>('/admin/erase', {
        method: 'POST',
        body: { researchId: preview.researchId, level, confirmId, confirmPhrase: phrase },
      })
      setResult(r)
      setStep('done')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const warnings = preview && level ? warningsFor(level, preview) : []
  const option = options.find((o) => o.level === level)
  const idMatches = preview !== null && confirmId.trim().toUpperCase() === preview.researchId
  const canErase =
    idMatches && (level !== 'everything' || (understood && phrase.trim() === PHRASE)) && !busy

  return (
    <SettingsCard id="erase" title="Erase a participant" rootOnly>
      <SettingsRow
        label="Erase on request"
        help="For when someone asks to have their data removed. Look them up by research ID, choose how much to erase, and confirm. Every erase is recorded in the activity log, which is never erased."
      />

      <div className="er-body">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {step === 'find' && (
          <form
            className="er-find"
            onSubmit={(e) => {
              e.preventDefault()
              void find()
            }}
          >
            <input
              type="text"
              className="se-search er-id-input"
              aria-label="Research ID"
              placeholder="VB2-XXXX-XXXX"
              value={lookup}
              onChange={(e) => setLookup(e.target.value.toUpperCase())}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="se-btn is-dark" disabled={busy || !lookup.trim()}>
              {busy ? 'Looking up...' : 'Look up'}
            </button>
          </form>
        )}

        {preview && step !== 'find' && step !== 'done' && (
          <dl className="er-facts">
            <div>
              <dt>Research ID</dt>
              <dd className="se-mono">{preview.researchId}</dd>
            </div>
            <div>
              <dt>Account</dt>
              <dd>{preview.isAdmin ? 'Admin' : preview.accountDeleted ? 'Deleted' : 'Active'}</dd>
            </div>
            <div>
              <dt>Books in their app</dt>
              <dd>{preview.booksInApp.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Deleted books kept</dt>
              <dd>{preview.booksKept.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Tracking</dt>
              <dd>{preview.trackingOn ? 'On' : 'Off'}</dd>
            </div>
            <div>
              <dt>Tracking changes</dt>
              <dd>{preview.trackingChanges.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Notice answers</dt>
              <dd>{preview.notices.toLocaleString()}</dd>
            </div>
          </dl>
        )}

        {step === 'choose' && preview && (
          <>
            {preview.isAdmin ? (
              <p className="se-muted">Admin accounts can't be erased here. Remove their admin access first.</p>
            ) : (
              <div className="er-options" role="radiogroup" aria-label="What to erase">
                {options.map((o) => (
                  <button
                    key={o.level}
                    type="button"
                    role="radio"
                    aria-checked={level === o.level}
                    className={level === o.level ? 'er-option is-on' : 'er-option'}
                    onClick={() => setLevel(o.level)}
                  >
                    <span className="er-option-title">{o.title}</span>
                    <span className="er-option-line">
                      <strong>Erased:</strong> {o.erased}
                    </span>
                    <span className="er-option-line">
                      <strong>Kept:</strong> {o.kept}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="er-actions">
              <button type="button" className="se-btn" onClick={reset}>
                Cancel
              </button>
              {!preview.isAdmin && (
                <button
                  type="button"
                  className="se-btn is-dark"
                  disabled={!level}
                  onClick={() => {
                    setWarnIndex(0)
                    setStep('warn')
                  }}
                >
                  Continue
                </button>
              )}
            </div>
          </>
        )}

        {step === 'warn' && option && (
          <div className="er-warning" role="alert">
            <span className="er-warning-step">
              {option.title}: warning {warnIndex + 1} of {warnings.length}
            </span>
            <p>{warnings[warnIndex]}</p>
            <div className="er-actions">
              <button type="button" className="se-btn" onClick={reset}>
                Cancel
              </button>
              <button
                type="button"
                className="se-btn is-dark"
                onClick={() => (warnIndex + 1 < warnings.length ? setWarnIndex(warnIndex + 1) : setStep('confirm'))}
              >
                I understand, continue
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && preview && option && (
          <form
            className="er-confirm"
            onSubmit={(e) => {
              e.preventDefault()
              if (canErase) void erase()
            }}
          >
            <p className="er-confirm-title">{option.title}</p>

            {level === 'everything' && (
              <label className="er-check">
                <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
                I understand this cannot be undone.
              </label>
            )}

            <label className="er-field">
              <span>
                Type the research ID <span className="se-mono">{preview.researchId}</span> to confirm
              </span>
              <input
                type="text"
                className="se-search er-id-input"
                value={confirmId}
                onChange={(e) => setConfirmId(e.target.value.toUpperCase())}
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            {level === 'everything' && (
              <label className="er-field">
                <span>
                  Type <span className="se-mono">{PHRASE}</span>
                </span>
                <input
                  type="text"
                  className="se-search"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
            )}

            <div className="er-actions">
              <button type="button" className="se-btn" onClick={reset}>
                Cancel
              </button>
              <button type="submit" className="se-btn is-danger" disabled={!canErase}>
                {busy ? 'Erasing...' : option.title}
              </button>
            </div>
          </form>
        )}

        {step === 'done' && result && (
          <div className="er-done">
            <p>
              Done. {count(result.booksErased, 'book was', 'books were')} erased. This is now in the activity log under the
              research ID.
            </p>
            <button type="button" className="se-btn" onClick={reset}>
              Erase another
            </button>
          </div>
        )}
      </div>
    </SettingsCard>
  )
}
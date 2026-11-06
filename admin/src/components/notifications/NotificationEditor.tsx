import { useEffect, useState, type FormEvent } from 'react'
import type { AdminNotification, Audience, NotificationDraft, TemplatesResponse } from '../../types/notifications'
import { fromInputValue, nowInputValue, toInputValue } from '../../utils/localDateTime'
import { LinkedText } from './LinkedText'
import { fillTemplate, MAX_BODY } from './notificationFormat'
import { ResearchIdPicker } from './ResearchIdPicker'

// Create, edit, or copy a notification. The admin writes English only.
// Spanish users see Spanish only for a pilot template sent unchanged; the
// server decides, and this shows which it will be.

type Props = {
  mode: 'create' | 'edit'
  // Edit: the message. Create: a message to copy, or null for a blank one.
  from: AdminNotification | null
  templates: TemplatesResponse
  onSave: (draft: NotificationDraft) => Promise<string | null>
  onClose: () => void
}

export function NotificationEditor({ mode, from, templates, onSave, onClose }: Props) {
  const editing = mode === 'edit' && from !== null

  const [templateKey, setTemplateKey] = useState(from?.templateKey ?? '')
  const [vegetable, setVegetable] = useState(from?.vegetable ?? templates.vegetables[0]?.key ?? '')
  const [body, setBody] = useState(from?.bodyEn ?? '')
  const [startsAt, setStartsAt] = useState(editing ? toInputValue(from.startsAt) : nowInputValue())
  const [expiresAt, setExpiresAt] = useState(editing ? toInputValue(from.expiresAt) : '')
  const [repeatOn, setRepeatOn] = useState(from?.repeatDays != null)
  const [repeatDays, setRepeatDays] = useState(String(from?.repeatDays ?? 7))
  const [audience, setAudience] = useState<Audience>(from?.audience ?? 'all')
  const [includeGuests, setIncludeGuests] = useState(from?.includeGuests ?? false)
  const [includeIds, setIncludeIds] = useState<string[]>(from?.includeIds ?? [])
  const [excludeIds, setExcludeIds] = useState<string[]>(from?.excludeIds ?? [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const template = templates.templates.find((t) => t.key === templateKey) ?? null
  const veg = templates.vegetables.find((v) => v.key === vegetable) ?? null
  const spanishApplies =
    template !== null && fillTemplate(template, veg, templates.slot) === body.trim() && !body.includes(templates.slot)

  const startIso = fromInputValue(startsAt)
  const startsLater = startIso !== null && new Date(startIso).getTime() > Date.now() + 60_000

  function chooseTemplate(key: string) {
    setTemplateKey(key)
    const t = templates.templates.find((x) => x.key === key)
    setBody(t ? fillTemplate(t, veg, templates.slot) : '')
  }

  function chooseVegetable(key: string) {
    setVegetable(key)
    const v = templates.vegetables.find((x) => x.key === key) ?? null
    if (template?.needsVegetable) setBody(fillTemplate(template, v, templates.slot))
  }

  function check(): string | null {
    const text = body.trim()
    if (!text) return 'Write the message.'
    if (text.length > MAX_BODY) return `Keep the message to ${MAX_BODY} characters or fewer.`
    if (text.includes(templates.slot)) return 'Pick a vegetable for this message.'
    const s = fromInputValue(startsAt)
    const e = fromInputValue(expiresAt)
    if (!s || !e) return 'Choose a start date and an expiry date.'
    if (new Date(e) <= new Date(s)) return 'The expiry date must be after the start date.'
    if (repeatOn) {
      const d = Number(repeatDays)
      if (!Number.isInteger(d) || d < 1 || d > 365) return 'Repeat every 1 to 365 days.'
    }
    if (audience === 'selected' && includeIds.length === 0)
      return 'Pick at least one research ID, or send to everyone.'
    return null
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const problem = check()
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    const message = await onSave({
      bodyEn: body.trim(),
      templateKey: template?.key ?? null,
      vegetable: template?.needsVegetable ? vegetable : null,
      startsAt: fromInputValue(startsAt)!,
      expiresAt: fromInputValue(expiresAt)!,
      repeatDays: repeatOn ? Number(repeatDays) : null,
      audience,
      includeGuests,
      includeIds: audience === 'selected' ? includeIds : [],
      excludeIds: audience === 'all' ? excludeIds : [],
    })
    setBusy(false)
    if (message) setError(message)
  }

  const title = editing ? `Edit notification #${from.id}` : from ? 'Send again' : 'New notification'
  const saveLabel = editing ? 'Save changes' : startsLater ? 'Schedule' : 'Send now'

  return (
    <div className="dialog-backdrop">
      <form className="card nt-editor" onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-labelledby="nt-editor-title">
        <header className="nt-editor-head">
          <h2 id="nt-editor-title" className="dialog-title">
            {title}
          </h2>
          {editing && (
            <p className="muted">
              Changes apply right away. What people already did with it stays recorded.
            </p>
          )}
        </header>

        <div className="nt-editor-body">
          <fieldset className="nt-group">
            <legend className="nt-legend">Message</legend>

            <label className="nt-field">
              <span className="nt-label">Start from</span>
              <select className="nt-input" value={templateKey} onChange={(e) => chooseTemplate(e.target.value)}>
                <option value="">Blank message</option>
                {templates.templates.map((t) => (
                  <option key={t.key} value={t.key}>
                    Pilot: {t.en.replace(templates.slot, '...')}
                  </option>
                ))}
              </select>
            </label>

            {template?.needsVegetable && (
              <label className="nt-field">
                <span className="nt-label">Vegetable in season</span>
                <select className="nt-input" value={vegetable} onChange={(e) => chooseVegetable(e.target.value)}>
                  {templates.vegetables.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.en}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="nt-field">
              <span className="nt-label">Message (English)</span>
              <textarea
                className="nt-input nt-textarea"
                rows={4}
                maxLength={MAX_BODY}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <span className="nt-hint">
                {body.trim().length} of {MAX_BODY} characters. Addresses starting with https:// become links.
              </span>
            </label>

            <p className={`nt-lang ${spanishApplies ? 'is-ok' : ''}`}>
              {spanishApplies
                ? 'Spanish users see the Spanish version of this pilot message.'
                : 'Everyone sees this message in English.'}
            </p>

            {body.trim() && (
              <div className="nt-preview">
                <span className="nt-label">Preview</span>
                <p className="nt-preview-text">
                  <LinkedText text={body.trim()} />
                </p>
              </div>
            )}
          </fieldset>

          <fieldset className="nt-group">
            <legend className="nt-legend">When</legend>
            <div className="nt-row">
              <label className="nt-field">
                <span className="nt-label">Starts</span>
                <input className="nt-input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </label>
              <label className="nt-field">
                <span className="nt-label">Expires</span>
                <input className="nt-input" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </label>
            </div>
            <span className="nt-hint">Shown only between these times. Both can be changed later.</span>

            <label className="nt-check">
              <input type="checkbox" checked={repeatOn} onChange={(e) => setRepeatOn(e.target.checked)} />
              <span>Show it again every</span>
              <input
                className="nt-input nt-days"
                type="number"
                min={1}
                max={365}
                value={repeatDays}
                disabled={!repeatOn}
                onChange={(e) => setRepeatDays(e.target.value)}
                aria-label="Days between showings"
              />
              <span>days until it expires</span>
            </label>
          </fieldset>

          <fieldset className="nt-group">
            <legend className="nt-legend">Who gets it</legend>

            <div className="nt-radios">
              <label className="nt-check">
                <input type="radio" name="nt-audience" checked={audience === 'all'} onChange={() => setAudience('all')} />
                <span>All accounts</span>
              </label>
              <label className="nt-check">
                <input
                  type="radio"
                  name="nt-audience"
                  checked={audience === 'selected'}
                  onChange={() => setAudience('selected')}
                />
                <span>Only selected accounts</span>
              </label>
            </div>

            {audience === 'all' ? (
              <ResearchIdPicker
                label="Leave out"
                hint="Accounts chosen here do not get this message."
                selected={excludeIds}
                onChange={setExcludeIds}
              />
            ) : (
              <ResearchIdPicker
                label="Send to"
                hint="Only these accounts get this message."
                selected={includeIds}
                onChange={setIncludeIds}
              />
            )}

            <label className="nt-check">
              <input type="checkbox" checked={includeGuests} onChange={(e) => setIncludeGuests(e.target.checked)} />
              <span>Also show to guests (guests are never recorded for research)</span>
            </label>
            <span className="nt-hint">Admin accounts never get notifications.</span>
          </fieldset>
        </div>

        {error && (
          <p className="error nt-editor-error" role="alert">
            {error}
          </p>
        )}

        <footer className="dialog-actions nt-editor-actions">
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="button-primary" disabled={busy}>
            {busy ? 'Working...' : saveLabel}
          </button>
        </footer>
      </form>
    </div>
  )
}
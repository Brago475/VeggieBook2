import { useEffect, useState, type FormEvent } from 'react'
import { useNow } from '../../hooks/useNow'
import type { AdminNotification, Audience, NotificationDraft, TemplatesResponse } from '../../types/notifications'
import { startOfDay, timeOf } from '../../utils/calendarDates'
import { NavIcon } from '../icons/NavIcons'
import { StudyIcon } from '../studies/StudyIcons'
import { LinkedText } from './LinkedText'
import { LiveClock } from './LiveClock'
import { fillTemplate, MAX_BODY, MAX_TITLE, notificationName } from './notificationFormat'
import { PlaylistPicker, type PlaylistChoice } from './PlaylistPicker'
import { ResearchIdPicker } from './ResearchIdPicker'
import { endAt, startAt, startPassed, type Schedule } from './schedule'
import { ScheduleSection } from './ScheduleSection'

// Create, edit, or copy a notification, in the Studies dialog style. The
// header and the buttons stay in view; the sections scroll between them.
// The title is an admin-only label. The admin writes English only. Spanish
// users see Spanish only for a template sent unchanged; the server decides,
// and this shows which it will be. A message can open a playlist, timed and
// sent to the same people as the message. Closes on Cancel, the X, Escape,
// or a click outside.
//
// Send again (a copy) keeps the title, text, playlist, audience and repeat,
// and leaves the dates empty so they are picked fresh.

type Props = {
  mode: 'create' | 'edit'
  // Edit: the message. Create: a message to copy, or null for a blank one.
  from: AdminNotification | null
  templates: TemplatesResponse
  onSave: (draft: NotificationDraft) => Promise<string | null>
  onClose: () => void
}

const DEFAULT_START = '09:00'
const DEFAULT_END = '23:59'

// "(copy)" endings left by earlier versions of Send again.
const COPY_ENDINGS = /(\s*\(copy\))+$/i

function initialSchedule(from: AdminNotification | null, editing: boolean): Schedule {
  const repeat = {
    repeatOn: from?.repeatDays != null,
    repeatDays: String(from?.repeatDays ?? 7),
  }
  if (!editing || !from) {
    return { startMode: 'now', startDay: null, startTime: DEFAULT_START, endDay: null, endTime: DEFAULT_END, ...repeat }
  }

  const start = new Date(from.startsAt)
  const end = new Date(from.expiresAt)
  const started = start.getTime() <= Date.now()
  return {
    startMode: started ? 'fixed' : 'later',
    startDay: started ? null : startOfDay(start),
    startTime: started ? DEFAULT_START : timeOf(start),
    endDay: startOfDay(end),
    endTime: timeOf(end),
    ...repeat,
  }
}

function initialTitle(from: AdminNotification | null, editing: boolean): string {
  if (!from?.title) return ''
  return editing ? from.title : from.title.replace(COPY_ENDINGS, '').trim()
}

function initialPlaylist(from: AdminNotification | null): PlaylistChoice {
  const p = from?.playlist
  if (!p) return { mode: 'none', vegetable: '', meal: '', playlistId: null }
  if (p.auto && p.vegetable && p.meal) return { mode: 'auto', vegetable: p.vegetable, meal: p.meal, playlistId: null }
  return { mode: 'made', vegetable: '', meal: '', playlistId: p.id }
}

export function NotificationEditor({ mode, from, templates, onSave, onClose }: Props) {
  const editing = mode === 'edit' && from !== null
  const now = useNow(1000)

  const [title, setTitle] = useState(() => initialTitle(from, editing))
  const [templateKey, setTemplateKey] = useState(from?.templateKey ?? '')
  const [vegetable, setVegetable] = useState(from?.vegetable ?? templates.vegetables[0]?.key ?? '')
  const [body, setBody] = useState(from?.bodyEn ?? '')
  const [playlist, setPlaylist] = useState<PlaylistChoice>(() => initialPlaylist(from))
  const [schedule, setSchedule] = useState<Schedule>(() => initialSchedule(from, editing))
  const [fixedStart] = useState<Date | null>(() =>
    editing && new Date(from.startsAt).getTime() <= Date.now() ? new Date(from.startsAt) : null,
  )
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
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const template = templates.templates.find((t) => t.key === templateKey) ?? null
  const veg = templates.vegetables.find((v) => v.key === vegetable) ?? null
  const text = body.trim()
  const spanishApplies =
    template !== null && fillTemplate(template, veg, templates.slot) === text && !text.includes(templates.slot)

  const passed = startPassed(schedule, now)
  const startsNow = schedule.startMode === 'now' || passed

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
    if (title.trim().length > MAX_TITLE) return `Keep the title to ${MAX_TITLE} characters or fewer.`
    if (!text) return 'Write the message.'
    if (text.length > MAX_BODY) return `Keep the message to ${MAX_BODY} characters or fewer.`
    if (text.includes(templates.slot)) return 'Pick a vegetable for this message.'

    if (playlist.mode === 'auto' && (!playlist.vegetable || !playlist.meal))
      return 'Pick a vegetable and a meal for the playlist.'
    if (playlist.mode === 'made' && playlist.playlistId === null) return 'Pick a playlist.'

    const current = new Date()
    if (schedule.startMode === 'later' && !schedule.startDay) return 'Pick a start day on the calendar.'
    const start = startAt(schedule, current, fixedStart)
    const end = endAt(schedule)
    if (!end) return 'Pick an end day on the calendar.'
    if (start && end <= start) return 'The end must be after the start.'
    if (end <= current) return 'The end time has already passed.'

    if (schedule.repeatOn) {
      const d = Number(schedule.repeatDays)
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

    const current = new Date()
    const sendNow = schedule.startMode === 'now' || startPassed(schedule, current)
    const startsAt =
      schedule.startMode === 'fixed' && from
        ? from.startsAt
        : sendNow
          ? null
          : startAt(schedule, current, fixedStart)!.toISOString()

    setBusy(true)
    setError(null)
    const message = await onSave({
      title: title.trim() || null,
      bodyEn: text,
      templateKey: template?.key ?? null,
      vegetable: template?.needsVegetable ? vegetable : null,
      startNow: sendNow && schedule.startMode !== 'fixed',
      startsAt,
      expiresAt: endAt(schedule)!.toISOString(),
      repeatDays: schedule.repeatOn ? Number(schedule.repeatDays) : null,
      audience,
      includeGuests,
      includeIds: audience === 'selected' ? includeIds : [],
      excludeIds: audience === 'all' ? excludeIds : [],
      playlistMode: playlist.mode,
      playlistId: playlist.mode === 'made' ? playlist.playlistId : null,
      playlistVegetable: playlist.mode === 'auto' ? playlist.vegetable : null,
      playlistMeal: playlist.mode === 'auto' && playlist.meal ? playlist.meal : null,
    })
    setBusy(false)
    if (message) setError(message)
  }

  const heading = editing ? `Edit ${notificationName(from)}` : from ? 'Send again' : 'New notification'
  const subtitle = editing
    ? 'Changes apply right away. What people already did with it stays recorded.'
    : 'Shown in the app as a pop-up and in Notifications.'
  const saveLabel = editing ? 'Save changes' : startsNow ? 'Send now' : 'Schedule'

  return (
    <div className="st-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form
        className="st-dialog nt-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nt-editor-title"
        onSubmit={submit}
        noValidate
      >
        <div className="st-dialog-head">
          <span className="st-dialog-icon">
            <StudyIcon name="bell" size={20} />
          </span>
          <div className="st-dialog-title">
            <strong id="nt-editor-title">{heading}</strong>
            <span>{subtitle}</span>
          </div>
          <LiveClock />
          <button type="button" className="st-dialog-close" aria-label="Close" disabled={busy} onClick={onClose}>
            <StudyIcon name="close" size={16} />
          </button>
        </div>

        <div className="st-dialog-body nt-dialog-body">
          <section className="st-dialog-section nt-section">
            <span className="st-section-title">Message</span>

            <label className="nt-field">
              <span className="nt-label">Title</span>
              <input
                className="nt-input"
                maxLength={MAX_TITLE}
                value={title}
                placeholder="For example: Cucumber season, fall 2026"
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <div className="nt-row">
              <label className="nt-field">
                <span className="nt-label">Start from</span>
                <select className="nt-input" value={templateKey} onChange={(e) => chooseTemplate(e.target.value)}>
                  <option value="">Blank message</option>
                  {templates.templates.map((t) => (
                    <option key={t.key} value={t.key}>
                      Template: {t.en.replace(templates.slot, '...')}
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
            </div>

            <label className="nt-field">
              <span className="nt-label">Message (English)</span>
              <textarea
                className="nt-input nt-textarea"
                rows={3}
                maxLength={MAX_BODY}
                value={body}
                placeholder="Write what people will see in the app."
                onChange={(e) => setBody(e.target.value)}
              />
              <span className="nt-hint">
                {text.length} of {MAX_BODY} characters. Addresses starting with https:// become links.
              </span>
            </label>

            <p className={spanishApplies ? 'nt-lang is-ok' : 'nt-lang'}>
              {spanishApplies
                ? 'Spanish users see the Spanish version of this template.'
                : 'Everyone sees this message in English.'}
            </p>

            {text && (
              <div className="nt-field">
                <span className="nt-label">Preview</span>
                <div className="nt-preview">
                  <span className="nt-preview-icon">
                    <NavIcon name="bell" size={18} />
                  </span>
                  <div className="nt-preview-main">
                    <p className="nt-preview-text">
                      <LinkedText text={text} />
                    </p>
                    {playlist.mode !== 'none' && <span className="nt-preview-cta">Open playlist</span>}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="st-dialog-section nt-section">
            <span className="st-section-title">Playlist</span>
            <PlaylistPicker
              value={playlist}
              currentPlaylistId={editing ? (from.playlist?.id ?? null) : null}
              onChange={setPlaylist}
            />
          </section>

          <ScheduleSection value={schedule} onChange={setSchedule} now={now} fixedStart={fixedStart} />

          <section className="st-dialog-section nt-section">
            <span className="st-section-title">Who gets it</span>

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
          </section>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="st-dialog-actions nt-dialog-foot">
          <button type="button" className="st-button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="st-button is-green" disabled={busy}>
            <StudyIcon name="bell" size={16} />
            {busy ? 'Saving...' : saveLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
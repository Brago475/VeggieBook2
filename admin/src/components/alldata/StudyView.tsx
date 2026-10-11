import { useEffect, useRef, useState } from 'react'
import { useStudies } from '../../hooks/useStudies'
import type { StudySummary } from '../../types/studies'
import { fullDateTime, plural, studyFullTitle, studyRangeTimes, studyTitle } from '../studies/studyFormat'
import { AllDataIcon } from './AllDataIcons'
import '../../styles/alldata-study.css'

// "Show: All data | One study" on All Data.
//
//   All data    every book ever saved, any date, all together (the page as
//               it always was)
//   One study   a list of studies to pick from: name, number, Running if it
//               is running, dates with times (so two studies on the same day
//               are easy to tell apart), and how many books. Under the
//               switch, a blue line says exactly what is shown and has a
//               Show all data link.
//
// Picking a study reloads the page's data and downloads with only the books
// saved during it, by people whose tracking was on at the moment they saved
// (api/Research/AllData/AllDataStudy.cs).

type Props = {
  study: number | null // study number, null for all data
  onStudy: (study: number | null) => void
  books: number // books shown right now
}

function Running() {
  return (
    <span className="adv-running">
      <i aria-hidden="true" />
      Running
    </span>
  )
}

export function StudyView({ study, onStudy, books }: Props) {
  const { data } = useStudies()
  const [listOpen, setListOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const studies = data?.studies ?? [] // newest first
  const picked = studies.find((s) => s.number === study) ?? null
  const oneStudy = study !== null

  // The list closes on a click outside it or on Escape.
  useEffect(() => {
    if (!listOpen) return
    function onDown(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setListOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setListOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [listOpen])

  // "One study" starts on the running study, or the newest one.
  function showOneStudy() {
    const first = studies.find((s) => s.running) ?? studies[0]
    if (first) onStudy(first.number)
    setListOpen(true)
  }

  function choose(s: StudySummary) {
    onStudy(s.number)
    setListOpen(false)
  }

  return (
    <section className={oneStudy ? 'adv is-study' : 'adv'} aria-label="Which data to show">
      <div className="adv-row">
        <span className="adv-label">Show</span>

        <div className="adv-switch" role="radiogroup" aria-label="Show">
          <button
            type="button"
            role="radio"
            aria-checked={!oneStudy}
            className={!oneStudy ? 'adv-option is-on' : 'adv-option'}
            onClick={() => {
              onStudy(null)
              setListOpen(false)
            }}
          >
            All data
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={oneStudy}
            className={oneStudy ? 'adv-option is-on is-study' : 'adv-option'}
            disabled={studies.length === 0}
            title={studies.length === 0 ? 'No studies yet. A study is switched on from the Studies page.' : undefined}
            onClick={() => (oneStudy ? setListOpen((o) => !o) : showOneStudy())}
          >
            One study
          </button>
        </div>

        {!oneStudy && (
          <span className="adv-text">
            {studies.length === 0
              ? 'Every book ever saved. No studies yet.'
              : 'Every book ever saved, any date: before, during, and between studies.'}
          </span>
        )}

        {oneStudy && (
          <div className="adv-select" ref={boxRef}>
            <button
              type="button"
              className="adv-select-button"
              aria-haspopup="listbox"
              aria-expanded={listOpen}
              onClick={() => setListOpen((o) => !o)}
            >
              <strong>{picked ? studyTitle(picked) : `Study ${study}`}</strong>
              {picked?.name && <span className="adv-number">Study {picked.number}</span>}
              {picked?.running && <Running />}
              <span className="adv-chevron">
                <AllDataIcon name="down" size={16} />
              </span>
            </button>

            {listOpen && (
              <ul className="adv-list" role="listbox" aria-label="Studies">
                {studies.map((s) => {
                  const on = s.number === study
                  return (
                    <li key={s.id} role="option" aria-selected={on}>
                      <button type="button" className={on ? 'adv-item is-on' : 'adv-item'} onClick={() => choose(s)}>
                        <span className={s.running ? 'adv-swatch is-running' : 'adv-swatch'} aria-hidden="true" />
                        <span className="adv-item-text">
                          <span className="adv-item-name">
                            <strong>{studyTitle(s)}</strong>
                            {s.name && <span className="adv-number">Study {s.number}</span>}
                            {s.running && <Running />}
                          </span>
                          <span className="adv-item-dates">{studyRangeTimes(s.startedAt, s.endedAt)}</span>
                        </span>
                        <span className="adv-item-books">{plural(s.booksSaved, 'book', 'books')}</span>
                        <span className="adv-check" aria-hidden="true">
                          {on && <AllDataIcon name="check" size={16} />}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {oneStudy && (
        <div className="adv-note">
          <AllDataIcon name="calendar" size={16} />
          <span className="adv-note-text">
            {picked ? (
              <>
                <strong>Only {studyFullTitle(picked)}.</strong> Books saved from {fullDateTime(picked.startedAt)} to{' '}
                {picked.endedAt ? fullDateTime(picked.endedAt) : 'now (still running)'}, by people with tracking on.
              </>
            ) : (
              <>
                <strong>Study {study} no longer exists.</strong> It may have been deleted.
              </>
            )}
          </span>
          <strong className="adv-note-count">{plural(books, 'book', 'books')}</strong>
          <button type="button" className="adv-all" onClick={() => onStudy(null)}>
            Show all data
          </button>
        </div>
      )}
    </section>
  )
}
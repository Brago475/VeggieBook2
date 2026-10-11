import { useState } from 'react'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { StudyDetail } from '../components/studies/StudyDetail'
import { StudyList } from '../components/studies/StudyList'
import { StudySwitch } from '../components/studies/StudySwitch'
import type { AdminTab } from '../components/layout/navigation'
import { useStudies } from '../hooks/useStudies'
import '../styles/studies.css'

// The Studies page: one switch to run a study, and every study so far.
//
//   Top bar   the on/off switch (components/studies/StudySwitch.tsx)
//   Left      every study, newest first
//   Right     the chosen study: dates, numbers, who has tracking off
//
// A study runs from the moment it is switched on until it is switched off,
// and is numbered on its own (Study 1, Study 2). Only one runs at a time.
// Who is tracked and who sees the notice: api/Research/StudyTracking.cs.

type Props = {
  onOpen: (tab: AdminTab) => void
}

export function Studies({ onOpen }: Props) {
  const { data, error, switchStudy } = useStudies()
  const [picked, setPicked] = useState<number | null>(null)

  if (!data) {
    return error ? (
      <p className="error" role="alert">
        {error}
      </p>
    ) : (
      <p className="muted">Loading...</p>
    )
  }

  // The picked study, or the running one, or the newest.
  const selected = data.studies.find((s) => s.id === picked) ?? data.studies[0] ?? null

  return (
    <div className="st-page">
      <TopbarActions>
        <StudySwitch data={data} onSwitch={switchStudy} />
      </TopbarActions>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="st-layout">
        <StudyList studies={data.studies} selected={selected?.id ?? null} onSelect={setPicked} />

        {selected ? (
          <StudyDetail
            key={selected.id}
            study={selected}
            onOpenParticipants={() => onOpen('participants')}
            onOpenData={() => onOpen('data')}
          />
        ) : (
          <section className="st-detail st-empty">
            <strong>No studies yet</strong>
            <p>
              Use the switch at the top to start Study 1. Right now {data.preview.tracked.toLocaleString()} of{' '}
              {data.preview.people.toLocaleString()} participants have tracking on.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
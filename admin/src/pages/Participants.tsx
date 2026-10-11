import { useMemo, useState } from 'react'
import { AllDataIcon } from '../components/alldata/AllDataIcons'
import { TopbarActions } from '../components/layout/TopbarSlot'
import type { AdminTab } from '../components/layout/navigation'
import { ParticipantsBanner } from '../components/participants/ParticipantsBanner'
import { PersonCard } from '../components/participants/PersonCard'
import { PersonPanel } from '../components/participants/PersonPanel'
import { StatusTabs, type StatusFilter } from '../components/participants/StatusTabs'
import { useParticipants } from '../hooks/useParticipants'
import '../styles/studies.css'
import '../styles/participants.css'

// The Participants page: everyone by research ID, with their tracking.
//
//   Banner   the running study, how many people are tracked, the counts
//   Tabs     All, Tracking on, Turned off by them, Turned off by an admin
//   Search   by research ID
//   Cards    one per person, newest first
//   Panel    the picked person: status, every change, the study notice,
//            and the actions (turn off, undo an admin's turn-off, or open
//            their books in All Data)
//
// Admins and guests never appear. No name or email exists on this page.
// Book counts include only books saved while tracking was on.

type Props = {
  onOpen: (tab: AdminTab) => void
  // Opens All Data searched to this research ID.
  onOpenPersonData: (researchId: string) => void
}

export function Participants({ onOpen, onOpenPersonData }: Props) {
  const { data, error, loading, reload, setTracking } = useParticipants()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [panelClosed, setPanelClosed] = useState(false)

  const shown = useMemo(() => {
    const needle = search.trim().toUpperCase()
    return (data?.people ?? []).filter(
      (p) => (filter === 'all' || p.status === filter) && (!needle || p.researchId.includes(needle)),
    )
  }, [data, filter, search])

  if (!data) {
    return error ? (
      <p className="error" role="alert">
        {error}
      </p>
    ) : (
      <p className="muted">Loading...</p>
    )
  }

  // The panel shows the person clicked, or the first card until one is.
  const person = panelClosed
    ? null
    : (picked ? data.people.find((p) => p.researchId === picked) : undefined) ?? shown[0] ?? null

  function pick(researchId: string) {
    setPicked(researchId)
    setPanelClosed(false)
  }

  return (
    <div className="pt-page">
      <TopbarActions>
        <button type="button" className="st-button" onClick={() => void reload()}>
          <AllDataIcon name="refresh" size={17} className={loading ? 'pt-spin is-spinning' : 'pt-spin'} />
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </TopbarActions>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <ParticipantsBanner data={data} onOpenStudies={() => onOpen('studies')} />

      <div className="pt-bar-row">
        <StatusTabs counts={data.counts} value={filter} onChange={setFilter} />
        <label className="pt-search">
          <AllDataIcon name="search" size={16} />
          <input
            type="search"
            placeholder="Search by research ID..."
            aria-label="Search by research ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      <div className={person ? 'pt-split has-panel' : 'pt-split'}>
        {shown.length === 0 ? (
          <p className="st-muted pt-empty">
            {data.people.length === 0 ? 'No participants yet.' : 'No one matches.'}
          </p>
        ) : (
          <div className="pt-cards">
            {shown.map((p) => (
              <PersonCard
                key={p.researchId}
                person={p}
                selected={p.researchId === person?.researchId}
                onSelect={() => pick(p.researchId)}
              />
            ))}
          </div>
        )}

        {person && (
          <PersonPanel
            key={person.researchId}
            person={person}
            study={data.study}
            onSetTracking={(on) => setTracking(person.researchId, on)}
            onOpenData={() => onOpenPersonData(person.researchId)}
            onClose={() => setPanelClosed(true)}
          />
        )}
      </div>
    </div>
  )
}
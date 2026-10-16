import { csvRows } from '../activity/activityFormat'
import { downloadCsv } from '../questions/questionMath'
import { useActivity } from '../../hooks/useActivity'
import { exportUrl } from '../../utils/exportQuery'

// One file at a time. Books, Recipes and secrets, Activity and Content follow
// the scope picked above; Participants and the codebook do not.

type Props = {
  study: number | null
  answers: boolean
  scopeName: string
  onDownload: (label: string) => void
}

type FileCard = {
  name: string
  group: string
  text: string
  links: { label: string; href: string }[]
}

export function SingleFiles({ study, answers, scopeName, onDownload }: Props) {
  const activity = useActivity(study)
  const scope = { study, answers }

  const cards: FileCard[] = [
    {
      name: 'Books',
      group: 'Data',
      text: 'One row per book, with every answer.',
      links: ['xlsx', 'csv', 'spss'].map((f) => ({ label: label(f), href: exportUrl('all-data/export/books', scope, { format: f }) })),
    },
    {
      name: 'Recipes and secrets',
      group: 'Data',
      text: 'One row per recipe or secret kept or taken out.',
      links: ['xlsx', 'csv', 'spss'].map((f) => ({ label: label(f), href: exportUrl('all-data/export/items', scope, { format: f }) })),
    },
    {
      name: 'Question codebook',
      group: 'Data',
      text: 'Every question and answer choice, with its variable name. Same for every study.',
      links: ['xlsx', 'csv'].map((f) => ({ label: label(f), href: exportUrl('export/codebook', {}, { format: f }) })),
    },
    {
      name: 'Participants',
      group: 'Research',
      text: 'Research IDs, age ranges, and tracking status. Everyone, not limited to a study.',
      links: ['xlsx', 'csv'].map((f) => ({ label: label(f), href: exportUrl('research/export/participants', {}, { format: f }) })),
    },
    {
      name: 'Content library',
      group: 'System',
      text: 'Every recipe and secret, with kept and taken out counts.',
      links: ['xlsx', 'csv'].map((f) => ({ label: label(f), href: exportUrl('export/content', { study }, { format: f }) })),
    },
  ]

  const events = activity.data?.events ?? []

  return (
    <section className="ex-section" aria-labelledby="ex-files">
      <div>
        <h2 id="ex-files" className="ex-card-title">
          Single files
        </h2>
        <p className="ex-card-sub">One file at a time, for {scopeName.toLowerCase() === 'all data' ? 'all data' : scopeName}.</p>
      </div>

      <div className="ex-files">
        {cards.map((c) => (
          <div key={c.name} className="ex-file">
            <div className="ex-file-head">
              <span className="ex-file-name">{c.name}</span>
              <span className="ex-file-group">{c.group}</span>
            </div>
            <p className="ex-file-text">{c.text}</p>
            <div className="ex-fmts">
              {c.links.map((l) => (
                <a
                  key={l.label}
                  className="ex-fmt is-green"
                  href={l.href}
                  download
                  onClick={() => onDownload(`${c.name}, ${l.label}`)}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        ))}

        <div className="ex-file">
          <div className="ex-file-head">
            <span className="ex-file-name">Activity log</span>
            <span className="ex-file-group">System</span>
          </div>
          <p className="ex-file-text">Every event, newest first.</p>
          <div className="ex-fmts">
            <button
              type="button"
              className="ex-fmt is-green"
              disabled={events.length === 0}
              onClick={() => {
                downloadCsv('activity.csv', csvRows(events))
                onDownload('Activity log, CSV')
              }}
            >
              {activity.loading && !activity.data ? 'Loading...' : 'CSV'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function label(format: string): string {
  return format === 'xlsx' ? 'Excel' : format === 'spss' ? 'SPSS' : format.toUpperCase()
}
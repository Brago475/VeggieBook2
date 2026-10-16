import { useState } from 'react'
import { exportUrl } from '../../utils/exportQuery'
import { bundleFiles, bundleFormats } from './exportFormats'

// Pick files and formats; they download as one zip with a README.

type Props = {
  study: number | null
  answers: boolean
  onDownload: (label: string) => void
}

export function CustomZip({ study, answers, onDownload }: Props) {
  const [files, setFiles] = useState<Set<string>>(new Set(['books', 'items']))
  const [formats, setFormats] = useState<Set<string>>(new Set(['xlsx']))

  function flip(set: Set<string>, id: string, apply: (next: Set<string>) => void) {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    apply(next)
  }

  const count = files.size * formats.size
  const href = exportUrl(
    'export/bundle',
    { study, answers },
    {
      files: bundleFiles.filter((f) => files.has(f.id)).map((f) => f.id).join(','),
      formats: bundleFormats.filter((f) => formats.has(f.id)).map((f) => f.id).join(','),
    },
  )

  return (
    <section className="ex-card" aria-labelledby="ex-custom">
      <div className="ex-card-head">
        <div>
          <h2 id="ex-custom" className="ex-card-title">
            Build your own zip
          </h2>
          <p className="ex-card-sub">Tick the files and formats you want. They come in one zip, named by date and study.</p>
        </div>
      </div>

      <div className="ex-card-body">
        <div className="ex-checks">
          {bundleFiles.map((f) => (
            <label key={f.id} className={files.has(f.id) ? 'ex-check is-on' : 'ex-check'}>
              <input type="checkbox" checked={files.has(f.id)} onChange={() => flip(files, f.id, setFiles)} />
              {f.label}
            </label>
          ))}
        </div>

        <div className="ex-foot is-plain">
          <div className="ex-format-checks" role="group" aria-label="Formats">
            {bundleFormats.map((f) => (
              <label key={f.id} className={formats.has(f.id) ? 'ex-format-check is-on' : 'ex-format-check'}>
                <input type="checkbox" checked={formats.has(f.id)} onChange={() => flip(formats, f.id, setFormats)} />
                {f.label}
              </label>
            ))}
          </div>
          {count > 0 ? (
            <a className="ex-dark" href={href} download onClick={() => onDownload(`Custom zip, ${count} files`)}>
              Download {count} {count === 1 ? 'file' : 'files'}
            </a>
          ) : (
            <span className="ex-dark is-off" aria-disabled="true">
              Pick a file and a format
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
import { AllDataIcon, type AllDataIconName } from '../alldata/AllDataIcons'

// One download format on the Export page. A plain link: the browser saves
// what the API sends, using the admin session.

type Props = {
  label: string
  text: string
  icon: AllDataIconName
  href: string
}

export function ExportFormatCard({ label, text, icon, href }: Props) {
  return (
    <div className="ex-card">
      <div className="ex-card-head">
        <span className="ex-card-icon" aria-hidden="true">
          <AllDataIcon name={icon} size={18} />
        </span>
        <h3 className="ex-card-title">{label}</h3>
      </div>
      <p className="ex-card-text">{text}</p>
      <a className="st-button ex-card-link" href={href} download>
        Download {label}
      </a>
    </div>
  )
}
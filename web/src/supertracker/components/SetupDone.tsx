import { useStrings } from '../../i18n/useStrings'
import type { Profile } from '../api/superTrackerApi'
import { ST_SETUP } from '../strings/setup'
import { cmToFeetInches, kgToPounds } from '../utils/units'

// The saved answers, shown until the tracker is built.

type Props = {
  profile: Profile
  onEdit: () => void
}

export function SetupDone({ profile, onEdit }: Props) {
  const t = useStrings(ST_SETUP)
  const us = profile.units === 'us'
  const fi = cmToFeetInches(profile.heightCm)

  const rows: [string, string][] = [
    [t.age, String(profile.age)],
    [t.sex, profile.sex === 'female' ? t.female : t.male],
    [t.height, us ? `${fi.feet} ${t.feet} ${fi.inches} ${t.inches}` : `${Math.round(profile.heightCm)} ${t.cm}`],
    [t.weight, us ? `${kgToPounds(profile.weightKg)} ${t.pounds}` : `${profile.weightKg} ${t.kg}`],
    [t.activity, t.activities[profile.activity].title],
    [t.calorieGoal, profile.calorieGoal ? `${profile.calorieGoal.toLocaleString()} ${t.goalUnit}` : t.estimated],
  ]

  return (
    <section className="st2-panel">
      <h1 className="library-title st2-title">{t.doneTitle}</h1>
      <p className="st2-intro">{t.doneText}</p>
      <dl className="st2-summary">
        {rows.map(([label, value]) => (
          <div key={label} className="st2-summary-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <button type="button" className="st2-guide" onClick={onEdit}>
        {t.edit}
      </button>
    </section>
  )
}
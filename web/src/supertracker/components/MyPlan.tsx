import { useStrings } from '../../i18n/useStrings'
import type { FoodGroup, Plan, Profile } from '../api/superTrackerApi'
import { ST_PLAN } from '../strings/plan'
import { ST_SETUP } from '../strings/setup'
import { count, range } from '../utils/format'
import { cmToFeetInches } from '../utils/units'
import '../styles/plan.css'

// "My plan": daily calories, food group servings, limits and the
// weekly activity goal, from api/SuperTracker/CaloriePlan.cs.

type Props = {
  profile: Profile
  plan: Plan
  onEdit: () => void
}

const GROUPS: FoodGroup[] = ['vegetables', 'fruits', 'dairy', 'wholeGrains', 'protein', 'healthyFats']

export function MyPlan({ profile, plan, onEdit }: Props) {
  const t = useStrings(ST_PLAN)
  const s = useStrings(ST_SETUP)

  const fi = cmToFeetInches(profile.heightCm)
  const height =
    profile.units === 'us'
      ? `${fi.feet} ${s.feet} ${fi.inches} ${s.inches}`
      : `${Math.round(profile.heightCm)} ${s.cm}`
  const summary = [
    profile.sex === 'female' ? s.female : s.male,
    String(profile.age),
    height,
    `${s.activities[profile.activity].title.toLowerCase()} ${t.activityWord}`,
  ].join(', ')

  return (
    <div className="st2-plan">
      <header className="st2-plan-head">
        <div>
          <h1 className="library-title st2-title">{t.title}</h1>
          <p className="st2-hint">{t.basedOn}</p>
        </div>
        <button type="button" className="st2-guide" onClick={onEdit}>
          {t.edit}
        </button>
      </header>

      <section className="st2-plan-calories">
        <p className="st2-plan-big">
          {count(plan.calories)} <span>{t.calories}</span>
        </p>
        <p className="st2-hint">
          {summary}.{' '}
          {plan.fromGoal
            ? t.fromDoctor
            : `${t.estimated} ${count(plan.estimatedCalories)} ${t.estimatedEnd}`}
        </p>
      </section>

      <section className="st2-plan-section">
        <h2 className="st2-plan-h2">{t.eatTitle}</h2>
        <ul className="st2-groups">
          {GROUPS.map((g) => {
            const r = plan.servings[g]
            return (
              <li key={g} className="st2-group">
                <div className="st2-group-top">
                  <span className="st2-group-name">{t.groups[g].name}</span>
                  <span className="st2-group-amount">
                    {range(r.min, r.max, t.to)} {t.servingsWord}
                  </span>
                </div>
                <p className="st2-group-size">{t.groups[g].size}</p>
                {g === 'protein' && (
                  <p className="st2-group-size">
                    <strong>
                      {plan.proteinGrams.min} {t.to} {plan.proteinGrams.max}
                    </strong>{' '}
                    {t.proteinGrams}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="st2-plan-section">
        <h2 className="st2-plan-h2">{t.limitsTitle}</h2>
        <dl className="st2-summary">
          <div className="st2-summary-row">
            <dt>{t.sodium}</dt>
            <dd>
              {t.lessThan} {count(plan.limits.sodiumMg)} mg
            </dd>
          </div>
          <div className="st2-summary-row">
            <dt>{t.satFat}</dt>
            <dd>
              {t.lessThan} {plan.limits.saturatedFatG} g
            </dd>
          </div>
        </dl>
        <p className="st2-hint">{t.activityGoal.replace('{n}', String(plan.activityMinutesPerWeek))}</p>
      </section>

      <p className="st2-plan-source">{t.source}</p>
    </div>
  )
}
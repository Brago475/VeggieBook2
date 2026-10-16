import type { SiteSettingsInfo } from '../../types/settings'
import { SettingsCard, SettingsRow } from './SettingsCard'

// The research rules, shown as they are. Tracking on by default is part of
// the Terms, so it is not changed from here.

type Props = {
  research: SiteSettingsInfo['research']
}

export function ResearchSection({ research }: Props) {
  const pct = research.accounts ? Math.round((research.termsAccepted / research.accounts) * 100) : 0

  return (
    <SettingsCard id="research" title="Research">
      <SettingsRow
        label="Tracking on for new accounts"
        help="New accounts start with research tracking on. Each person can turn it off in their settings."
      >
        <span className="se-fixed">Set by the Terms</span>
      </SettingsRow>
      <SettingsRow
        label="Notice for people who opted out"
        help="While a study runs, people with tracking off see a notice and can opt back in."
      >
        <span className="se-fixed">Always on</span>
      </SettingsRow>
      <SettingsRow label="Never track admins" help="Admin accounts are left out of every count and download.">
        <span className="se-fixed">Always on</span>
      </SettingsRow>
      <SettingsRow
        label="Terms and Privacy"
        help={`Version ${research.termsVersion}, accepted by ${research.termsAccepted.toLocaleString()} of ${research.accounts.toLocaleString()} accounts.`}
      >
        <span className="se-pct">{pct}%</span>
      </SettingsRow>
    </SettingsCard>
  )
}
import { useState } from 'react'
import { ComingSoon } from './components/common/ComingSoon'
import { AdminShell } from './components/layout/AdminShell'
import type { AdminTab } from './components/layout/navigation'
import { useSession } from './hooks/useSession'
import { Accounts } from './pages/Accounts'
import { Analytics } from './pages/Analytics'
import { Overview } from './pages/Overview'
import { SignIn } from './pages/SignIn'

// The admin site for VeggieBook2, served at admin.veggiebook2.com.
//
// Two locks keep it private: Cloudflare Access lets only listed emails load
// the site, and the API refuses every /api/admin/ request from an account
// without the Admin role. The sign-in screen here is the second lock's
// front door; it is not the security on its own.
//
// Screens are switched with a tab in state rather than a router. Sections
// that are not built yet describe what is coming (see
// components/layout/navigation.ts for which ones are ready).

const upcoming: Partial<Record<AdminTab, { title: string; text: string }>> = {
  studies: {
    title: 'Studies',
    text: 'Create studies, invite participants, and turn tracking on and off. Tracking stays off until the IRB is approved.',
  },
  questions: {
    title: 'Questions',
    text: 'Every VeggieBook question with how often each answer is picked, in counts and percentages.',
  },
  answers: {
    title: 'Answers',
    text: 'Answers by person (by anonymous Study ID) and in total, with filters.',
  },
  spss: {
    title: 'SPSS Data',
    text: 'One row per session by anonymous Study ID, with dates, times, and time on each question. Export to Excel, CSV, and SPSS.',
  },
  reports: {
    title: 'Reports',
    text: 'Frequencies, percentages, means, medians, standard deviations, and cross-tabs, per person and in total.',
  },
  system: {
    title: 'System',
    text: 'Server and database health, and a log of admin actions such as unlocks and role changes.',
  },
}

export function App() {
  const { session, signIn, signOut } = useSession()
  const [tab, setTab] = useState<AdminTab>('overview')

  if (session.status === 'loading') {
    return <p className="admin-loading">Loading...</p>
  }

  if (session.status === 'signedOut') {
    return <SignIn onSignIn={signIn} />
  }

  const soon = upcoming[tab]

  return (
    <AdminShell
      email={session.email}
      isRoot={session.isRoot}
      tab={tab}
      onTab={setTab}
      onSignOut={signOut}
    >
      {tab === 'overview' && <Overview />}
      {tab === 'analytics' && <Analytics />}
      {tab === 'accounts' && <Accounts currentEmail={session.email} />}
      {soon && <ComingSoon title={soon.title} text={soon.text} />}
    </AdminShell>
  )
}
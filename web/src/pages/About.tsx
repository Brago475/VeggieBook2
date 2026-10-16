import {
  AwardIcon,
  BrowserIcon,
  ExternalIcon,
  PaperIcon,
  PhoneIcon,
  SchoolIcon,
} from '../components/icons/AboutIcons'
import { LeafDecor } from '../components/layout/LeafDecor'
import { useLang } from '../i18n/languageContext'
import { ABOUT } from '../i18n/strings/about'
import { COMMON } from '../i18n/strings/common'
import { useStrings } from '../i18n/useStrings'

// About VeggieBook: who created the original app, who funded it, who built
// the phone apps, how it was rebuilt at Kean, and where to read the
// research.
//
// The original app had no About screen. The facts here come from the
// original team's FAQ (VeggieBookOpenSource/VeggieBook, FAQs.md), the
// SNAP-Ed listing for VeggieBook, and the funding and author notes in the
// published papers listed at the bottom. Crediting the original creators
// is also required by the CC BY-SA 4.0 license on the original images.
//
// The words are in strings/about.ts. Paper titles stay in English, as
// published.
//
// Open to everyone, signed in or not. Read only. Back returns home.

type Paper = {
  authors: string
  year: number
  title: string
  journal: string
  doi: string
}

// Only papers whose DOI was checked against the paper itself.
const PAPERS: Paper[] = [
  {
    authors: 'Clarke, P., Evans, S. H., & Neffa-Creech, D.',
    year: 2019,
    title:
      'Mobile app increases vegetable-based preparations by low-income household cooks: a randomized controlled trial',
    journal: 'Public Health Nutrition',
    doi: '10.1017/S1368980018003117',
  },
  {
    authors: 'Evans, S. H., & Clarke, P.',
    year: 2019,
    title:
      'Resolving design issues in developing a nutrition app: a case study using formative research',
    journal: 'Evaluation and Program Planning',
    doi: '10.1016/j.evalprogplan.2018.10.010',
  },
  {
    authors: 'Clarke, P., Evans, S. H., & Hovy, E. H.',
    year: 2011,
    title:
      'Indigenous message tailoring increases consumption of fresh vegetables by clients of community pantries',
    journal: 'Health Communication',
    doi: '10.1080/10410236.2011.558337',
  },
  {
    authors: 'Evans, S. H., Clarke, P., & Koprowski, C.',
    year: 2010,
    title:
      'Information design to promote better nutrition among pantry clients: four methods of formative evaluation',
    journal: 'Public Health Nutrition',
    doi: '10.1017/S1368980009990851',
  },
]

const OPEN_SOURCE_URL = 'https://github.com/VeggieBookOpenSource'
const GPL_URL = 'https://www.gnu.org/licenses/gpl-3.0.html'
const CC_BY_SA_URL = 'https://creativecommons.org/licenses/by-sa/4.0/'

// A link to another site: opens in a new tab, and says so to screen
// readers, since the arrow icon is decorative.
function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  const t = useStrings(ABOUT)
  return (
    <a className="about-link" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ExternalIcon className="about-link-icon" />
      <span className="visually-hidden">{t.newTab}</span>
    </a>
  )
}

type CardProps = {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

function AboutCard({ icon, title, children }: CardProps) {
  return (
    <section className="account-card about-card">
      <div className="account-card-head">
        <span className="account-card-icon">{icon}</span>
        <div className="account-card-head-text">
          <h2 className="account-card-title">{title}</h2>
        </div>
      </div>
      <div className="about-body">{children}</div>
    </section>
  )
}

function Paragraphs({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </>
  )
}

export function About() {
  const { lang } = useLang()
  const t = useStrings(ABOUT)
  const common = useStrings(COMMON)

  return (
    <div className="account-screen about-screen">
      <LeafDecor className="account-leaf" />
      <LeafDecor className="account-leaf is-small" />

      <header className="about-hero">
        <img
          className="about-logo"
          src={`/brand/logo-positive-${lang}.png`}
          alt={common.veggieLogoAlt}
        />
        <h1 className="about-title">{t.title}</h1>
        <p className="about-intro">{t.intro}</p>
      </header>

      <AboutCard icon={<SchoolIcon />} title={t.originTitle}>
        <Paragraphs lines={t.origin} />
      </AboutCard>

      <AboutCard icon={<AwardIcon />} title={t.fundingTitle}>
        <Paragraphs lines={t.funding} />
      </AboutCard>

      <AboutCard icon={<PhoneIcon />} title={t.appsTitle}>
        <Paragraphs lines={t.apps} />
        <p>
          <OutLink href={OPEN_SOURCE_URL}>{t.openSource}</OutLink>
        </p>
      </AboutCard>

      <AboutCard icon={<BrowserIcon />} title={t.keanTitle}>
        <Paragraphs lines={t.kean} />
      </AboutCard>

      <AboutCard icon={<PaperIcon />} title={t.researchTitle}>
        <p>{t.researchIntro}</p>
        <ul className="about-papers">
          {PAPERS.map((paper) => (
            <li key={paper.doi}>
              <span className="about-paper-cite">
                {paper.authors} ({paper.year}).
              </span>{' '}
              <OutLink href={`https://doi.org/${paper.doi}`}>{paper.title}</OutLink>{' '}
              <span className="about-paper-journal">{paper.journal}.</span>
            </li>
          ))}
        </ul>
      </AboutCard>

      <p className="about-license">
        {t.licenseBefore}
        <OutLink href={GPL_URL}>GNU General Public License v3.0</OutLink>
        {t.licenseMiddle}
        <OutLink href={CC_BY_SA_URL}>Creative Commons Attribution-ShareAlike 4.0</OutLink>
        {t.licenseAfter}
      </p>
    </div>
  )
}
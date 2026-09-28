import {
  AwardIcon,
  BrowserIcon,
  ExternalIcon,
  PaperIcon,
  PhoneIcon,
  SchoolIcon,
} from '../components/AboutIcons'
import { LeafDecor } from '../components/LeafDecor'

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
// Open to everyone, signed in or not. Read only. Back returns home.
//
// English only for now; the Spanish text comes in with the English/Spanish
// toggle, like the rest of the site.

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
  return (
    <a className="about-link" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <ExternalIcon className="about-link-icon" />
      <span className="visually-hidden"> (opens in a new tab)</span>
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

export function About() {
  return (
    <div className="account-screen about-screen">
      <LeafDecor className="account-leaf" />
      <LeafDecor className="account-leaf is-small" />

      <header className="about-hero">
        <img
          className="about-logo"
          src="/brand/logo-positive-en.png"
          alt="VeggieBook, Quick Help for Meals"
        />
        <h1 className="about-title">About VeggieBook</h1>
        <p className="about-intro">
          VeggieBook helps home cooks make more meals with vegetables. You pick a
          vegetable you have, answer a few questions, and get your own book of
          recipes and tips. Secrets Books add simple, no-cost ideas for better
          breakfasts, lunches, dinners, snacks, and food shopping.
        </p>
      </header>

      <AboutCard icon={<SchoolIcon />} title="Where it came from">
        <p>
          VeggieBook was created by Dr. Peter Clarke and Dr. Susan H. Evans at the
          Annenberg School for Communication and Journalism, University of
          Southern California.
        </p>
        <p>
          It was shaped by years of research with families who use community food
          pantries. Professional chefs contributed recipes, and families tested
          the recipes and Secrets before they were added.
        </p>
        <p>
          In a study with nearly 300 households, cooks who used VeggieBook
          prepared 38% more vegetable dishes than cooks who did not. VeggieBook is
          listed in the USDA SNAP-Ed Toolkit.
        </p>
      </AboutCard>

      <AboutCard icon={<AwardIcon />} title="Funding">
        <p>
          The original VeggieBook was supported by the U.S. Department of
          Agriculture, National Institute of Food and Agriculture, through an
          Agriculture and Food Initiative grant (2012-68001-15952) for Childhood
          Obesity Prevention.
        </p>
        <p>
          Earlier research that led to the app was supported by USDA grant
          2006-55215-16730.
        </p>
      </AboutCard>

      <AboutCard icon={<PhoneIcon />} title="The original apps">
        <p>
          The iPhone app was built by TechEmpower, and the Android app was built
          by DiPasquo Consulting.
        </p>
        <p>
          In 2021, the creators made the app's code freely available so other
          organizations could use and adapt it.
        </p>
        <p>
          <OutLink href={OPEN_SOURCE_URL}>VeggieBook open source code</OutLink>
        </p>
      </AboutCard>

      <AboutCard icon={<BrowserIcon />} title="Rebuilt at Kean University">
        <p>
          In 2026, VeggieBook was rebuilt as a website at Kean University, in the
          Department of Biological Sciences, under the direction of Dr.
          Spaccarotella.
        </p>
        <p>
          The website keeps the original recipes, Secrets, and questions. It adds
          personal accounts, so your books are saved and can be opened on any
          device with a web browser. There is nothing to download, and you can
          still use it as a guest.
        </p>
      </AboutCard>

      <AboutCard icon={<PaperIcon />} title="Research">
        <p>Published studies about VeggieBook and the research behind it:</p>
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
        The original VeggieBook code is open source under the{' '}
        <OutLink href={GPL_URL}>GNU General Public License v3.0</OutLink>. Photos from
        the original project are used under the{' '}
        <OutLink href={CC_BY_SA_URL}>Creative Commons Attribution-ShareAlike 4.0</OutLink>{' '}
        license.
      </p>
    </div>
  )
}
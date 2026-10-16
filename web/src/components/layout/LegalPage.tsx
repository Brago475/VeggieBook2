import type { ReactNode } from 'react'
import { ABOUT } from '../../i18n/strings/about'
import { LEGAL } from '../../i18n/strings/legal'
import { useLang } from '../../i18n/languageContext'
import { useStrings, type Strings } from '../../i18n/useStrings'
import { LeafDecor } from '../layout/LeafDecor'

// Layout for the Terms of Use and Privacy Policy. Text lives in src/content.

export type LegalSection = {
  // Section anchor, for example /privacy#research-tracking.
  id: string
  heading: string
  body: ReactNode
}

export type LegalDocument = {
  title: string
  // Recorded with each account on sign-up. Same value in every language.
  version: string
  updated: string
  intro?: ReactNode
  sections: LegalSection[]
}

type Props = {
  doc: Strings<LegalDocument>
}

export function LegalPage({ doc }: Props) {
  const { lang } = useLang()
  const page = useStrings(doc)
  const t = useStrings(LEGAL)

  return (
    <div className="account-screen about-screen legal-screen">
      <LeafDecor className="account-leaf" />
      <LeafDecor className="account-leaf is-small" />

      <header className="about-hero">
        <img
          className="about-logo"
          src={`/brand/logo-positive-${lang}.png`}
          alt={t.logoAlt}
        />
        <h1 className="about-title">{page.title}</h1>
        <p className="legal-meta">{t.versionLine(page.version, page.updated)}</p>
      </header>

      {page.intro && <div className="legal-intro">{page.intro}</div>}

      <article className="account-card about-card legal-card">
        {page.sections.map((section, i) => (
          <section key={section.id} id={section.id} className="legal-section">
            <h2 className="legal-heading">
              <span className="legal-number">{i + 1}.</span> {section.heading}
            </h2>
            <div className="about-body">{section.body}</div>
          </section>
        ))}
      </article>
    </div>
  )
}

// Contact block used by both documents and the locked password reset screen.
export function LegalContact() {
  const t = useStrings(ABOUT)
  return (
    <p>
      Dr. Kim Spaccarotella
      <br />
      {t.contactDept}
      <br />
      <a className="about-link" href="mailto:kim.spaccarotella@kean.edu">
        kim.spaccarotella@kean.edu
      </a>
    </p>
  )
}
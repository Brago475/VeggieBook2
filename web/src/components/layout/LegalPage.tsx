import type { ReactNode } from 'react'
import { LeafDecor } from '../layout/LeafDecor'

// The layout for the Terms of Use and the Privacy Policy. The words live in
// src/content/terms.tsx and src/content/privacy.tsx, so the text can be
// updated without touching this layout.
//
// Built on the About page's pieces: the off-white account screen with the
// two faint corner leaves, the logo heading, and a white card. Each section
// gets its own heading so the page is easy to scan and link to.
//
// The opening line (intro) sits in a highlighted box above the sections,
// so what the reader agrees to is the first thing they see.
//
// Open to everyone, signed in or not. Read only. Back returns home.

export type LegalSection = {
  // Used as the section's anchor, for example /privacy#research-studies.
  id: string
  heading: string
  body: ReactNode
}

export type LegalDocument = {
  title: string
  // Saved with each account when the user agrees, so the site knows who has
  // agreed to which version. Change it whenever the text changes.
  version: string
  updated: string
  intro?: ReactNode
  sections: LegalSection[]
}

type Props = {
  doc: LegalDocument
}

export function LegalPage({ doc }: Props) {
  return (
    <div className="account-screen about-screen legal-screen">
      <LeafDecor className="account-leaf" />
      <LeafDecor className="account-leaf is-small" />

      <header className="about-hero">
        <img
          className="about-logo"
          src="/brand/logo-positive-en.png"
          alt="VeggieBook, Quick Help for Meals"
        />
        <h1 className="about-title">{doc.title}</h1>
        <p className="legal-meta">
          Version {doc.version} · Last updated {doc.updated}
        </p>
      </header>

      {doc.intro && <div className="legal-intro">{doc.intro}</div>}

      <article className="account-card about-card legal-card">
        {doc.sections.map((section, i) => (
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

// The contact block both documents end with.
export function LegalContact() {
  return (
    <p>
      Dr. Kim Spaccarotella
      <br />
      Department of Biological Sciences, Kean University
      <br />
      <a className="about-link" href="mailto:kim.spaccarotella@kean.edu">
        kim.spaccarotella@kean.edu
      </a>
    </p>
  )
}
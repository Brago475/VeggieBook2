import type { ReactNode } from 'react'

// One titled part of a recipe or secret (Ingredients, Why It Works...).

type Props = {
  title: string
  children: ReactNode
}

export function ContentSection({ title, children }: Props) {
  return (
    <section className="content-section">
      <h3 className="content-section-title">{title}</h3>
      {children}
    </section>
  )
}
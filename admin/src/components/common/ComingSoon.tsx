// A placeholder card for a section that isn't built yet.

type Props = {
  title: string
  text: string
}

export function ComingSoon({ title, text }: Props) {
  return (
    <section className="card">
      <h1 className="page-title">{title}</h1>
      <p className="muted">{text}</p>
    </section>
  )
}
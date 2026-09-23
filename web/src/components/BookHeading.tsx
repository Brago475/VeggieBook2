// The heading at the top of a saved book: the VeggieBook mark, a small
// "YOUR" above the book's name, and an optional short line underneath.
//
// The title is the page's h1, since it names what the whole screen is.
// The mark is decorative (the title already says what the page is), so it
// has empty alt text. It lives in public/brand/ with the other logos.

type Props = {
  title: string
  eyebrow?: string
  tagline?: string
}

export function BookHeading({ title, eyebrow = 'Your', tagline }: Props) {
  return (
    <div className="book-heading">
      <img className="book-heading-logo" src="/brand/LogoVB2.png" alt="" />
      <div className="book-heading-text">
        <p className="book-heading-eyebrow">{eyebrow}</p>
        <h1 className="book-heading-title">{title}</h1>
        {tagline && <p className="book-heading-tagline">{tagline}</p>}
      </div>
    </div>
  )
}
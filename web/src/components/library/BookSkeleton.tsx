// Stand-in for a saved book while it loads: gray shapes in the places the
// heading, cover card, recipe count and recipe cards will appear, on the
// same off-white page. When the book arrives, the real content takes the
// same places, so the page does not jump.
//
// Screen readers hear "Opening your book" once, instead of a list of empty
// shapes.

const ROWS = 4

export function BookSkeleton() {
  return (
    <div className="book-view book-skeleton" role="status" aria-busy="true">
      <span className="visually-hidden">Opening your book...</span>

      <div className="book-heading" aria-hidden="true">
        <span className="skeleton skel-logo" />
        <div className="book-heading-text skel-heading-text">
          <span className="skeleton skel-eyebrow" />
          <span className="skeleton skel-title" />
        </div>
      </div>

      <div className="cover-preview" aria-hidden="true">
        <div className="skeleton skel-card" />
      </div>

      <p className="book-count" aria-hidden="true">
        <span className="skeleton skel-pill" />
      </p>

      <ul className="book-recipes" aria-hidden="true">
        {Array.from({ length: ROWS }, (_, i) => (
          <li key={i}>
            <div className="skel-row">
              <span className="skeleton skel-thumb" />
              <span className="skeleton skel-row-title" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
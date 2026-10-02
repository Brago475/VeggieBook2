// Stand-in for one recipe while it loads: a bar for the title, a 3:2 block
// for the photo, and lines for the sections. Used when opening a recipe in
// a saved book, and while the matching recipes are being found before
// KEEP / DROP. Same size as the real recipe, so nothing jumps when it
// arrives.
//
// Screen readers hear "Loading recipe" once, instead of a list of empty
// shapes.

export function RecipeSkeleton() {
  return (
    <div className="recipe-detail" role="status" aria-busy="true">
      <span className="visually-hidden">Loading recipe...</span>

      <div aria-hidden="true">
        <div className="skeleton skel-recipe-title" />
        <div className="skeleton skel-recipe-photo" />

        <div className="recipe-loading">
          <div className="skeleton skeleton-tab" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />

          <div className="skeleton skeleton-tab" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      </div>
    </div>
  )
}
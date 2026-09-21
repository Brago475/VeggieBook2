// The full-screen loading state: the VeggieBook logo on the brand green
// with three pulsing dots.
//
// The same screen is written directly into web/index.html, where it shows
// before any JavaScript has loaded. This component takes over while the
// app checks whether the visitor is signed in. Both use the class names
// styled in index.html, so going from one to the other shows no change at
// all. Keep this markup matching the markup there.

export function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-label="Loading VeggieBook">
      <img className="loading-logo" src="/brand/logo-negative-en.png" alt="" />
      <div className="loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
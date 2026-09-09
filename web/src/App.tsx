import { useEffect, useState } from 'react'
import './App.css'

// Vegetable picker.
//
// Matches the original app's "Select VeggieBook" screen: a scrolling list of
// rows, each a stock photo and a name. Selecting one eventually starts the
// question flow; for now it just records the choice so the wiring can be
// seen working.

type Vegetable = {
  code: string
  shortCode: string
  name: string
  image: string
  recipeCount: number
}

function App() {
  const [vegetables, setVegetables] = useState<Vegetable[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Vegetable | null>(null)

  useEffect(() => {
    fetch('/api/vegetables')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setVegetables)
      .catch((err) => setError(String(err)))
  }, [])

  return (
    <div className="app">
      {/* The negative logo is the one built for a colored background, which
          is why it sits on the green bar. Files live in public/brand/ and are
          referenced by absolute path, not imported, so swapping the Spanish
          version later is a string change rather than a new import. */}
      <header className="masthead">
        <img
          className="masthead-logo"
                    src="/brand/logo-negative-en.png"
          alt="VeggieBook, Quick Help for Meals"
        />
      </header>

      <p className="screen-label">Select VeggieBook</p>

      {error && <p className="message">Could not load vegetables: {error}</p>}
      {!error && vegetables.length === 0 && <p className="message">Loading...</p>}

      <ul className="veg-list">
        {vegetables.map((veg) => (
          <li key={veg.code}>
            <button
              type="button"
              className="veg-row"
              onClick={() => setSelected(veg)}
            >
              <img
                className="veg-thumb"
                src={`/images/${veg.image}`}
                alt=""
                loading="lazy"
              />
              <span className="veg-name">{veg.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <p className="message">
          Selected: {selected.name} ({selected.recipeCount} recipes)
        </p>
      )}
    </div>
  )
}

export default App
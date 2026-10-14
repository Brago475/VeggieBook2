import { useState, type KeyboardEvent } from 'react'
import { useAccountSearch } from '../../hooks/useAccountSearch'
import type { AccountRow } from '../../types/settings'

// A searchable dropdown of accounts that are not admins yet, for Add an
// admin. Lists the newest accounts first; typing searches email and
// username on the server.

type Props = {
  picked: AccountRow | null
  onPick: (account: AccountRow | null) => void
  refreshKey: number
}

const SHOWN = 50

export function AccountPicker({ picked, onPick, refreshKey }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const { data, loading } = useAccountSearch(query, 'all', SHOWN, refreshKey)
  const options = (data?.results ?? []).filter((r) => !r.isAdmin)

  function choose(account: AccountRow) {
    onPick(account)
    setQuery('')
    setOpen(false)
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && options[active]) {
      e.preventDefault()
      choose(options[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="se-picker">
      <input
        id="se-add-admin"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="se-picker-list"
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Choose an account..."
        value={picked && !open ? picked.email : query}
        onFocus={() => {
          setOpen(true)
          setActive(0)
        }}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
          if (picked) onPick(null)
        }}
        onKeyDown={onKey}
      />
      <span className="se-picker-caret" aria-hidden="true" />

      {open && (
        <ul id="se-picker-list" className="se-picker-list" role="listbox" aria-label="Accounts">
          {loading && options.length === 0 && <li className="se-picker-empty">Loading...</li>}
          {!loading && options.length === 0 && <li className="se-picker-empty">No accounts match.</li>}
          {options.map((a, i) => (
            <li
              key={a.id}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'se-picker-option is-active' : 'se-picker-option'}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(a)
              }}
              onMouseEnter={() => setActive(i)}
            >
              <strong>{a.email}</strong>
              <span>{a.username ?? 'No username'}</span>
            </li>
          ))}
          {data && data.total > SHOWN && !query && (
            <li className="se-picker-empty">Showing the newest {SHOWN}. Type to search the rest.</li>
          )}
        </ul>
      )}
    </div>
  )
}
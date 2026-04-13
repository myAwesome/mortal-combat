import { useEffect, useState } from 'react'
import { getPlayers } from '../../api/players'
import { setEntryList } from '../../api/championships'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'

export default function EntryListStep({ champ, onDone }) {
  const [allPlayers, setAllPlayers] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getPlayers()
      .then((players) => {
        setAllPlayers(players)
        // Pre-select existing entry list
        if (champ.players?.length > 0) {
          const existing = new Set(champ.players.map((p) => String(p.id)).filter(Boolean))
          setSelected(existing)
        }
      })
      .finally(() => setLoading(false))
  }, [champ.id])

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(String(id))) next.delete(String(id))
      else next.add(String(id))
      return next
    })
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      await setEntryList(champ.id, Array.from(selected).map(Number))
      onDone()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  const overCapacity = selected.size > champ.capacity
  const searchValue = search.trim().toLowerCase()
  const isSearchActive = searchValue.length >= 3
  const visiblePlayers = isSearchActive
    ? allPlayers.filter((player) => player.name.toLowerCase().includes(searchValue))
    : []

  return (
    <div className="card">
      <h2 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>Entry List</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
        Search and select up to {champ.capacity} players to enter this championship.
      </p>

      <ErrorMessage error={error} />

      {allPlayers.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No players available. Add players first.</p>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player (min 3 chars)"
              style={{ width: '100%' }}
            />
          </div>

          {!isSearchActive ? (
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Type at least 3 characters to start searching players.
            </p>
          ) : visiblePlayers.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              No players found.
            </p>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
            {visiblePlayers.map((p) => {
              const checked = selected.has(String(p.id))
              return (
                <label
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    border: `1px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: checked ? 'var(--color-primary-light)' : 'var(--color-white)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: checked ? 600 : 400,
                    transition: 'all 0.1s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p.id)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  {p.name}
                </label>
              )
            })}
          </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: overCapacity ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
              {selected.size} / {champ.capacity} selected
            </span>
            <button
              className="btn"
              onClick={handleSubmit}
              disabled={saving || selected.size === 0 || overCapacity}
            >
              {saving ? 'Saving…' : 'Set Entry List'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPlayers } from '../../api/players'
import { setEntryList } from '../../api/championships'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'
import PlayerLink from "../../components/PlayerLink.jsx";

export default function EntryListStep({ champ, onDone }) {
    const [selected, setSelected] = useState(new Set())
    const [selectedById, setSelectedById] = useState({})
    const [search, setSearch] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [defaultPlayers, setDefaultPlayers] = useState([])
    const [loadingDefault, setLoadingDefault] = useState(true)
    const [loadingSearch, setLoadingSearch] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // Load existing players from championship
    useEffect(() => {
        const existingPlayers = (champ.players || []).filter((p) => p?.id !== undefined && p?.id !== null)
        setSelected(new Set(existingPlayers.map((p) => String(p.id))))
        setSelectedById(
            existingPlayers.reduce((acc, player) => {
                acc[String(player.id)] = player
                return acc
            }, {})
        )
        setSearch('')
        setSearchResults([])
    }, [champ.id, champ.players])

    // Preload top 32 players on mount
    useEffect(() => {
        let cancelled = false
        setLoadingDefault(true)

        getPlayers({ limit: 32, offset: 0 })
            .then((result) => {
                if (cancelled) return
                setDefaultPlayers(result.items || [])
                // Add preloaded players to selectedById so toggle works correctly
                setSelectedById((prev) => {
                    const next = { ...prev }
                    ;(result.items || []).forEach((p) => {
                        if (!next[String(p.id)]) next[String(p.id)] = p
                    })
                    return next
                })
            })
            .catch((err) => {
                if (cancelled) return
                setError(err)
            })
            .finally(() => {
                if (cancelled) return
                setLoadingDefault(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    // Search players when query >= 3 chars
    useEffect(() => {
        const query = search.trim()
        if (query.length < 2) {
            setSearchResults([])
            setLoadingSearch(false)
            return
        }

        let cancelled = false
        setLoadingSearch(true)
        setError(null)

        getPlayers({ search: query, limit: 50, offset: 0 })
            .then((result) => {
                if (cancelled) return
                const items = result.items || []
                setSearchResults(items)
                // Also add to selectedById so toggle works for search results
                setSelectedById((prev) => {
                    const next = { ...prev }
                    items.forEach((p) => {
                        if (!next[String(p.id)]) next[String(p.id)] = p
                    })
                    return next
                })
            })
            .catch((err) => {
                if (cancelled) return
                setError(err)
            })
            .finally(() => {
                if (cancelled) return
                setLoadingSearch(false)
            })

        return () => {
            cancelled = true
        }
    }, [search])

    const toggle = (player) => {
        const id = String(player.id)
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
        setSelectedById((prev) => {
            const next = { ...prev }
            if (!next[id]) next[id] = player
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

    const overCapacity = selected.size > champ.capacity
    const searchValue = search.trim()
    const isSearchActive = searchValue.length >= 3
    const selectedPlayers = Array.from(selected).map((id) => selectedById[id]).filter(Boolean)

    // Which list to show in the grid
    const displayPlayers = isSearchActive ? searchResults : defaultPlayers

    return (
        <div className="card">
            <h2 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>Entry List</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Select up to {champ.capacity} players to enter this championship.
            </p>

            <ErrorMessage error={error} />

            <div style={{ marginBottom: '1rem' }}>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search player…"
                    style={{ width: '100%' }}
                />
            </div>

            {selectedPlayers.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        Selected players:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {selectedPlayers.map((player) => (
                            <button
                                key={player.id}
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => toggle(player)}
                                title="Remove player"
                            >
                                {player.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {loadingDefault && !isSearchActive ? (
                <Spinner />
            ) : loadingSearch ? (
                <Spinner />
            ) : displayPlayers.length === 0 && isSearchActive ? (
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    No players found.
                </p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                    {displayPlayers.map((p) => {
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
                                    onChange={() => toggle(p)}
                                    style={{ accentColor: 'var(--color-primary)' }}
                                />
                                <PlayerLink player={p}/>
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
        </div>
    )
}

import { useEffect, useState } from 'react'
import { getLigueRanking, getLiguePlayers, addLiguePlayer, removeLiguePlayer } from '../api/ligue'
import { getPlayers } from '../api/players'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmButton from '../components/ConfirmButton'

export default function Ligue() {
  const [ranking, setRanking] = useState([])
  const [liguePlayers, setLiguePlayers] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [adding, setAdding] = useState(false)
  const [tab, setTab] = useState('ranking')

  const load = () =>
    Promise.all([getLigueRanking(), getLiguePlayers(), getPlayers()])
      .then(([r, lp, ap]) => {
        setRanking(r)
        setLiguePlayers(lp)
        setAllPlayers(ap)
      })
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const liguePlayerIds = new Set(liguePlayers.map((lp) => String(lp.id)))
  const availablePlayers = allPlayers.filter((p) => !liguePlayerIds.has(String(p.id)))

  const handleAdd = async () => {
    if (!selectedId) return
    setAdding(true)
    setError(null)
    try {
      await addLiguePlayer(Number(selectedId))
      setSelectedId('')
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id) => {
    setError(null)
    try {
      await removeLiguePlayer(id)
      await load()
    } catch (err) {
      setError(err)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>Ligue</h1>
      </div>

      <ErrorMessage error={error} />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          className={tab === 'ranking' ? 'btn' : 'btn btn-secondary'}
          onClick={() => setTab('ranking')}
        >
          Rankings
        </button>
        <button
          className={tab === 'manage' ? 'btn' : 'btn btn-secondary'}
          onClick={() => setTab('manage')}
        >
          Manage Players
        </button>
      </div>

      {tab === 'ranking' && (
        <div className="card">
          {ranking.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>No players in ligue yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Points</th>
                  <th>Championships</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row) => (
                  <tr key={row.player?.name ?? row.player}>
                    <td style={{ width: '48px', fontWeight: 700, color: row.place <= 3 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                      {row.place}
                    </td>
                    <td style={{ fontWeight: 500 }}>{row.player?.name ?? row.player}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{row.points}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{row.champsPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'manage' && (
        <div>
          {availablePlayers.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  style={{ flexGrow: 1, maxWidth: '280px' }}
                >
                  <option value="">Select player to add…</option>
                  {availablePlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  className="btn"
                  onClick={handleAdd}
                  disabled={adding || !selectedId}
                >
                  {adding ? 'Adding…' : 'Add to Ligue'}
                </button>
              </div>
            </div>
          )}

          <div className="card">
            {liguePlayers.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>No players in ligue yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Points</th>
                    <th>Championships</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {liguePlayers.map((lp) => (
                    <tr key={lp.id}>
                      <td style={{ fontWeight: 500 }}>{lp.name}</td>
                      <td>{lp.points}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        {lp.champs?.join(', ') || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <ConfirmButton onConfirm={() => handleRemove(lp.id)}>
                          Remove
                        </ConfirmButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

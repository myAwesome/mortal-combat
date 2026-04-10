import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getLigue,
  getLigueRanking,
  getLiguePlayers,
  removeLiguePlayer,
  removeLiguePlayersBatch,
} from '../api/ligues'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmButton from '../components/ConfirmButton'

export default function LigueDetail() {
  const { id } = useParams()
  const [ligue, setLigue] = useState(null)
  const [ranking, setRanking] = useState([])
  const [liguePlayers, setLiguePlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDeleteIds, setSelectedDeleteIds] = useState([])
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [tab, setTab] = useState('ranking')

  const load = () =>
    Promise.all([getLigue(id), getLigueRanking(id), getLiguePlayers(id)])
      .then(([l, r, lp]) => {
        setLigue(l)
        setRanking(r)
        setLiguePlayers(lp)
      })
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [id])

  const handleRemove = async (lpId) => {
    setError(null)
    try {
      await removeLiguePlayer(id, lpId)
      setSelectedDeleteIds((prev) => prev.filter((selected) => String(selected) !== String(lpId)))
      await load()
    } catch (err) {
      setError(err)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedDeleteIds.length === 0) return
    setBatchDeleting(true)
    setError(null)
    try {
      await removeLiguePlayersBatch(id, selectedDeleteIds)
      setSelectedDeleteIds([])
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setBatchDeleting(false)
    }
  }

  const toggleDeleteSelection = (lpId) => {
    setSelectedDeleteIds((prev) => (
      prev.includes(lpId)
        ? prev.filter((id) => id !== lpId)
        : [...prev, lpId]
    ))
  }

  const toggleSelectAllForDelete = () => {
    if (selectedDeleteIds.length === liguePlayers.length) {
      setSelectedDeleteIds([])
      return
    }
    setSelectedDeleteIds(liguePlayers.map((lp) => lp.id))
  }

  if (loading) return <Spinner />
  if (!ligue) return <ErrorMessage error={{ error: 'Ligue not found' }} />

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: '0.25rem' }}>
            <Link to="/ligues" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              ← Ligues
            </Link>
          </div>
          <h1>{ligue.name}</h1>
        </div>
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
          <div className="card" style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
            Players are added to this ligue automatically from the entry list of championships linked to this ligue.
          </div>

          <div className="card">
            {liguePlayers.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>No players in ligue yet.</p>
            ) : (
              <>
                <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={toggleSelectAllForDelete}
                  >
                    {selectedDeleteIds.length === liguePlayers.length ? 'Clear Selection' : 'Select All'}
                  </button>
                  <ConfirmButton
                    onConfirm={handleBatchDelete}
                    disabled={batchDeleting || selectedDeleteIds.length === 0}
                  >
                    {batchDeleting ? 'Deleting…' : `Delete Selected (${selectedDeleteIds.length})`}
                  </ConfirmButton>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Player</th>
                      <th>Points</th>
                      <th>Championships</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {liguePlayers.map((lp) => (
                      <tr key={lp.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedDeleteIds.includes(lp.id)}
                            onChange={() => toggleDeleteSelection(lp.id)}
                          />
                        </td>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

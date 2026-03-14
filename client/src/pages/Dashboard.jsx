import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPlayers } from '../api/players'
import { getChampionships } from '../api/championships'
import { getLigues } from '../api/ligues'
import Spinner from '../components/Spinner'
import './Dashboard.css'

export default function Dashboard() {
  const [data, setData] = useState({ players: [], championships: [], ligues: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPlayers(), getChampionships(), getLigues()])
      .then(([players, championships, ligues]) =>
        setData({ players, championships, ligues })
      )
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const { players, championships, ligues } = data

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="dash-stats">
        <Link to="/players" className="stat-card">
          <div className="stat-value">{players.length}</div>
          <div className="stat-label">Players</div>
        </Link>
        <Link to="/championships" className="stat-card">
          <div className="stat-value">{championships.length}</div>
          <div className="stat-label">Championships</div>
        </Link>
        <Link to="/ligues" className="stat-card">
          <div className="stat-value">{ligues.length}</div>
          <div className="stat-label">Ligues</div>
        </Link>
      </div>

      {ligues.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Ligues</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ligues.map((l) => (
              <Link
                key={l.id}
                to={`/ligues/${l.id}`}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)', textDecoration: 'none' }}
              >
                <span style={{ fontWeight: 500 }}>{l.name}</span>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
            <Link to="/ligues" style={{ fontSize: '0.875rem' }}>Manage ligues →</Link>
          </div>
        </div>
      )}

      {championships.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Recent Championships</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {championships.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/championships/${c.id}`}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)', textDecoration: 'none' }}
              >
                <span style={{ fontWeight: 500 }}>{c.name}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  capacity: {c.capacity} · {c.hasGroups ? 'groups' : 'no groups'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

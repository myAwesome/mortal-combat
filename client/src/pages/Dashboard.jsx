import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPlayers } from '../api/players'
import { getChampionships } from '../api/championships'
import { getLigueRanking } from '../api/ligue'
import Spinner from '../components/Spinner'
import './Dashboard.css'

export default function Dashboard() {
  const [data, setData] = useState({ players: [], championships: [], ranking: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPlayers(), getChampionships(), getLigueRanking()])
      .then(([players, championships, ranking]) =>
        setData({ players, championships, ranking })
      )
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const { players, championships, ranking } = data

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
        <Link to="/ligue" className="stat-card">
          <div className="stat-value">{ranking.length}</div>
          <div className="stat-label">Ligue Rankings</div>
        </Link>
      </div>

      {ranking.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Top Ligue Rankings</h2>
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
              {ranking.slice(0, 5).map((row) => (
                <tr key={row.player?.name ?? row.player}>
                  <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{row.place}</td>
                  <td style={{ fontWeight: 500 }}>{row.player?.name ?? row.player}</td>
                  <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{row.points}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{row.champsPlayed}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ranking.length > 5 && (
            <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
              <Link to="/ligue" style={{ fontSize: '0.875rem' }}>View all →</Link>
            </div>
          )}
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

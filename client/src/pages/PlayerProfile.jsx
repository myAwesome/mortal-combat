import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPlayer, getPlayerMatches, updatePlayer, deletePlayer } from '../api/players'
import { getChampionships } from '../api/championships'
import { getLigues, getLiguePlayers } from '../api/ligues'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmButton from '../components/ConfirmButton'

export default function PlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [championships, setChampionships] = useState([])
  const [matchesByChampionship, setMatchesByChampionship] = useState([])
  const [ligues, setLigues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [p, champs, ligueList, groupedMatches] = await Promise.all([
        getPlayer(id),
        getChampionships(),
        getLigues(),
        getPlayerMatches(id),
      ])
      setPlayer(p)
      setEditName(p.name)
      setMatchesByChampionship(groupedMatches)

      const relatedChampionships = champs.filter((c) =>
        Array.isArray(c.players) && c.players.some((cp) => String(cp.id) === String(id))
      )
      setChampionships(relatedChampionships)

      const liguePlayersLists = await Promise.all(
        ligueList.map((l) =>
          getLiguePlayers(l.id)
            .then((players) => ({ ligue: l, players }))
            .catch(() => ({ ligue: l, players: [] }))
        )
      )
      const relatedLigues = liguePlayersLists
        .filter(({ players }) => players.some((lp) => String(lp.name) === String(p.name)))
        .map(({ ligue, players }) => {
          const entry = players.find((lp) => String(lp.name) === String(p.name))
          return {
            ...ligue,
            points: entry?.points ?? 0,
            champsPlayed: entry?.champsPlayed ?? 0,
          }
        })
      setLigues(relatedLigues)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!editName.trim()) return
    setSaving(true)
    setError(null)
    try {
      await updatePlayer(id, editName.trim())
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await deletePlayer(id)
      navigate('/players')
    } catch (err) {
      setError(err)
      setDeleting(false)
    }
  }

  if (loading) return <Spinner />
  if (!player) return <ErrorMessage error={{ error: 'Player not found' }} />

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: '0.25rem' }}>
            <Link to="/players" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              ← Players
            </Link>
          </div>
          <h1>{player.name}</h1>
        </div>
      </div>

      <ErrorMessage error={error} />

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          Player ID: {player.id}
        </div>
        <form onSubmit={handleSave} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{ width: '260px' }}
          />
          <button type="submit" className="btn" disabled={saving || !editName.trim()}>
            {saving ? 'Saving…' : 'Save Name'}
          </button>
          <ConfirmButton onConfirm={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete Player'}
          </ConfirmButton>
        </form>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Ligues</h2>
        {ligues.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Not assigned to any ligue.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Points</th>
                <th>Championships</th>
              </tr>
            </thead>
            <tbody>
              {ligues.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link to={`/ligues/${l.id}`} style={{ fontWeight: 500 }}>{l.name}</Link>
                  </td>
                  <td>{l.points}</td>
                  <td>{l.champsPlayed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Championships</h2>
        {championships.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No championship entries yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Capacity</th>
                <th>Format</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {championships.map((c) => {
                const entry = c.players?.find((cp) => String(cp.id) === String(id))
                return (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/championships/${c.id}`} style={{ fontWeight: 500 }}>
                        {c.name}
                      </Link>
                    </td>
                    <td>{c.capacity}</td>
                    <td>{c.hasGroups ? 'Groups + Playoff' : 'Playoff only'}</td>
                    <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{entry?.points ?? 0}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Matches by Championship</h2>
        {matchesByChampionship.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No completed matches yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {matchesByChampionship.map((group) => (
              <div
                key={group.championship.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.6rem 0.75rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Link
                    to={`/championships/${group.championship.id}`}
                    style={{ fontWeight: 600, color: 'var(--color-primary)' }}
                  >
                    {group.championship.name}
                  </Link>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    {group.matches.length} matches
                  </span>
                </div>
                <table style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Opponent</th>
                      <th>Result</th>
                      <th>Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.matches.map((match) => {
                      const isPlayer1 = String(match.player1Id) === String(id)
                      const opponentName = isPlayer1 ? match.player2Name : match.player1Name
                      const isWin =
                        (match.winnerId && String(match.winnerId) === String(id)) ||
                        (!match.winnerId && String(match.winnerName) === String(player.name))
                      const outcome = isWin ? 'Win' : 'Loss'
                      return (
                        <tr key={match.id}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{match.stage || match.phase}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                              {match.phase}
                            </div>
                          </td>
                          <td>{opponentName || '—'}</td>
                          <td>{match.result || '—'}</td>
                          <td style={{ fontWeight: 600, color: outcome === 'Win' ? '#2c7a3a' : '#c53030' }}>
                            {outcome}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

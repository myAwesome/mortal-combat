import { useState } from 'react'
import { recordGroupMatch } from '../../api/championships'
import { getScorePlaceholder, isScoreInputShapeValid } from './scoreFormat'
import './GroupCard.css'

function ResultInput({ onSubmit, disabled, setsToWin }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isScoreInputShapeValid(value, setsToWin)) {
      setError(`Некоректний формат. Приклад: ${getScorePlaceholder(setsToWin)}`)
      return
    }
    setError('')
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <form className="result-form" onSubmit={handleSubmit}>
      <input
        value={value}
        onChange={(e) => { setValue(e.target.value); setError('') }}
        placeholder={getScorePlaceholder(setsToWin)}
        maxLength={31}
        disabled={disabled}
      />
      <button type="submit" className="btn btn-sm" disabled={disabled || !value.trim()}>
        Save
      </button>
      {error && <span className="result-error">{error}</span>}
    </form>
  )
}

export default function GroupCard({ champ, group, onDone }) {
  const [saving, setSaving] = useState(null)

  const handleResult = async (matchId, result) => {
    setSaving(matchId)
    try {
      await recordGroupMatch(champ.id, group.name, matchId, result)
      onDone()
    } catch {
      // Silently ignore — onDone will re-fetch and show current state
    } finally {
      setSaving(null)
    }
  }

  const sortedPlayers = [...group.players].sort((a, b) => {
    if (a.place !== null && b.place !== null) return a.place - b.place
    if (a.place !== null) return -1
    if (b.place !== null) return 1
    return (b.points || 0) - (a.points || 0)
  })

  return (
    <div className="group-card">
      <div className="group-card-header">Group {group.name}</div>
      <div className="group-card-body">
        <div>
          <table className="group-standings">
            <thead>
              <tr>
                <th>Player</th>
                <th style={{ textAlign: 'center' }}>W</th>
                <th style={{ textAlign: 'center' }}>L</th>
                <th style={{ textAlign: 'center' }}>Pts</th>
                {sortedPlayers.some((p) => p.place !== null) && (
                  <th style={{ textAlign: 'center' }}>Place</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((p) => (
                <tr key={p.name} className={p.place !== null && p.place <= 2 ? 'winner-row' : ''}>
                  <td>{p.name}</td>
                  <td style={{ textAlign: 'center' }}>{p.win ?? 0}</td>
                  <td style={{ textAlign: 'center' }}>{p.loose ?? 0}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.points ?? 0}</td>
                  {sortedPlayers.some((q) => q.place !== null) && (
                    <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      {p.place ?? '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="group-matches">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
            Matches
          </div>
          {group.matches.map((m) => (
            <div key={m.id} className="group-match-row">
              <div className="match-players">
                <span className={`match-player ${m.winner === m.player1 ? 'winner' : ''}`}>
                  {m.player1}
                </span>
                <span className="match-vs">vs</span>
                <span className={`match-player ${m.winner === m.player2 ? 'winner' : ''}`}>
                  {m.player2}
                </span>
              </div>
              {m.result ? (
                <span className="match-result">{m.result}</span>
              ) : (
                <ResultInput
                  onSubmit={(result) => handleResult(m.id, result)}
                  disabled={saving === m.id}
                  setsToWin={champ.setsToWin || 1}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

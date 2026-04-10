import { useState } from 'react'
import { recordDrawMatch } from '../../api/championships'

function PlayerRow({ player, isWinner, result }) {
  if (!player) {
    return <div className="bracket-player-row empty">TBD</div>
  }
  if (player.isBye) {
    return <div className="bracket-player-row bye">BYE</div>
  }
  return (
    <div className={`bracket-player-row ${isWinner ? 'winner' : ''}`}>
      <span>{player.name}</span>
      {result && isWinner && <span className="bracket-score">{result}</span>}
    </div>
  )
}

export default function BracketMatch({ match, champId, onDone }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const winnerName = typeof match.winner === 'string' ? match.winner : match.winner?.name

  const canEnterResult =
    !match.result &&
    match.player1 && !match.player1.isBye &&
    match.player2 && !match.player2.isBye

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!/^\d+-\d+$/.test(value.trim())) {
      setError('Format: 6-4')
      return
    }
    setError('')
    setSaving(true)
    try {
      await recordDrawMatch(champId, match.id, value.trim())
      onDone()
    } catch {
      setError('Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bracket-match">
      <PlayerRow player={match.player1} isWinner={winnerName === match.player1?.name} result={match.result} />
      <PlayerRow player={match.player2} isWinner={winnerName === match.player2?.name} result={match.result} />
      {canEnterResult && (
        <form className="bracket-result-form" onSubmit={handleSubmit}>
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value); setError('') }}
            placeholder="6-4"
            maxLength={7}
            disabled={saving}
          />
          <button type="submit" className="btn btn-sm" disabled={saving || !value.trim()}>
            Save
          </button>
          {error && <span className="bracket-result-error">{error}</span>}
        </form>
      )}
    </div>
  )
}

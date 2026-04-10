import { useState } from 'react'
import { createDraw, startDraw } from '../../api/championships'
import PlayoffBracket from './PlayoffBracket'
import ErrorMessage from '../../components/ErrorMessage'

export default function DrawStep({ champ, onDone }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCreateDraw = async () => {
    setLoading(true)
    setError(null)
    try {
      await createDraw(champ.id)
      onDone()
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartDraw = async () => {
    setLoading(true)
    setError(null)
    try {
      await startDraw(champ.id)
      onDone()
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  // No draw yet
  if (!champ.draw) {
    return (
      <div className="card">
        <h2 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>Playoff Draw</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Create the playoff bracket for this championship.
        </p>
        <ErrorMessage error={error} />
        <button className="btn" onClick={handleCreateDraw} disabled={loading}>
          {loading ? 'Creating…' : 'Create Draw'}
        </button>
      </div>
    )
  }

  // Draw created, check if seeded
  const firstRoundMatches = champ.draw.matches.filter(
    (m) => m.playersInRound === champ.draw.capacity
  )
  const isSeeded = firstRoundMatches.length === 0 || firstRoundMatches.some((m) => m.player1 !== null)

  if (!isSeeded) {
    return (
      <div className="card">
        <h2 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>Seed the Draw</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Assign qualified players to the bracket and start the playoff.
        </p>
        <ErrorMessage error={error} />
        <button className="btn" onClick={handleStartDraw} disabled={loading}>
          {loading ? 'Starting…' : 'Seed & Start Draw'}
        </button>
      </div>
    )
  }

  // Playoff in progress or complete
  const isComplete = champ.draw.completedMatches >= champ.draw.matches.length
  const completed = champ.draw.completedMatches
  const total = champ.draw.matches.length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Playoff Draw</h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {completed} / {total} matches completed
        </span>
      </div>

      {isComplete && (
        <div style={{
          background: 'var(--color-primary-light)',
          border: '1px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          color: 'var(--color-primary)',
          fontWeight: 600,
        }}>
          Championship complete!
        </div>
      )}

      <PlayoffBracket draw={champ.draw} champId={champ.id} onDone={onDone} setsToWin={champ.setsToWin || 1} />
    </div>
  )
}

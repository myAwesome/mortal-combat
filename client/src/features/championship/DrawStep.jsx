import { useEffect, useMemo, useState } from 'react'
import { createDraw, startDraw } from '../../api/championships'
import PlayoffBracket from './PlayoffBracket'
import ErrorMessage from '../../components/ErrorMessage'

const sortGroupPlayersByPlace = (players = []) =>
  [...players].sort((a, b) => {
    const placeA = Number(a.place ?? Number.MAX_SAFE_INTEGER)
    const placeB = Number(b.place ?? Number.MAX_SAFE_INTEGER)
    if (placeA !== placeB) return placeA - placeB
    if ((b.points ?? 0) !== (a.points ?? 0)) return (b.points ?? 0) - (a.points ?? 0)
    const diffA = (a.win ?? 0) - (a.loose ?? 0)
    const diffB = (b.win ?? 0) - (b.loose ?? 0)
    if (diffA !== diffB) return diffB - diffA
    return String(a.name || '').localeCompare(String(b.name || ''))
  })

const buildQualifierCandidates = (champ) => {
  if (!champ.draw) return []

  if (champ.hasGroups) {
    const groups = champ.groups || []
    if (groups.length === 0) return []
    const orderedGroups = groups.map((group) => sortGroupPlayersByPlace(group.players || []))
    const maxSize = Math.max(...orderedGroups.map((players) => players.length), 0)
    const result = []

    for (let index = 0; index < maxSize; index += 1) {
      const rankPlayers = orderedGroups
        .map((players) => players[index])
        .filter(Boolean)
        .sort((a, b) => {
          if ((b.points ?? 0) !== (a.points ?? 0)) return (b.points ?? 0) - (a.points ?? 0)
          const diffA = (a.win ?? 0) - (a.loose ?? 0)
          const diffB = (b.win ?? 0) - (b.loose ?? 0)
          if (diffA !== diffB) return diffB - diffA
          return String(a.name || '').localeCompare(String(b.name || ''))
        })
      result.push(...rankPlayers)
    }

    return result
      .slice(0, champ.draw.qualifiers || 0)
      .map((player) => ({ id: String(player.id), name: player.name }))
      .filter((player) => player.id !== 'undefined')
  }

  return (champ.players || [])
    .slice(0, champ.draw.qualifiers || 0)
    .map((player) => ({ id: String(player.id), name: player.name }))
    .filter((player) => player.id !== 'undefined')
}

export default function DrawStep({ champ, onDone }) {
  const [setupMode, setSetupMode] = useState('auto')
  const [manualPlayerIds, setManualPlayerIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const drawCandidates = useMemo(() => buildQualifierCandidates(champ), [champ])

  useEffect(() => {
    if (!champ.draw) return
    if (setupMode !== 'manual') return
    const totalSlots = champ.draw.capacity || 0
    const next = Array.from({ length: totalSlots }, (_v, index) => drawCandidates[index]?.id || '')
    setManualPlayerIds(next)
  }, [setupMode, champ.draw, drawCandidates])

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
      if (setupMode === 'manual') {
        await startDraw(champ.id, { manualPlayerIds })
      } else {
        await startDraw(champ.id)
      }
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
    const hasManualOption = drawCandidates.length > 0
    const selectedPlayerIds = manualPlayerIds.filter(Boolean)
    const hasDuplicates = new Set(selectedPlayerIds).size !== selectedPlayerIds.length
    const canStartManual =
      hasManualOption &&
      manualPlayerIds.length === (champ.draw.capacity || 0) &&
      selectedPlayerIds.length === drawCandidates.length &&
      !hasDuplicates

    return (
      <div className="card">
        <h2 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>Seed the Draw</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Assign qualified players to the bracket and start the playoff.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
            <input
              type="radio"
              name="draw-setup-mode"
              value="auto"
              checked={setupMode === 'auto'}
              onChange={() => setSetupMode('auto')}
            />
            Automatically
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
            <input
              type="radio"
              name="draw-setup-mode"
              value="manual"
              checked={setupMode === 'manual'}
              onChange={() => setSetupMode('manual')}
              disabled={!hasManualOption}
            />
            Manually
          </label>
        </div>
        {setupMode === 'manual' && hasManualOption && (
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            {manualPlayerIds.map((playerId, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px minmax(220px, 1fr)',
                  gap: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '0.875rem' }}>Slot #{index + 1}</div>
                <select
                  value={playerId}
                  onChange={(e) =>
                    setManualPlayerIds((prev) => {
                      const next = [...prev]
                      next[index] = e.target.value
                      return next
                    })
                  }
                >
                  <option value="">BYE</option>
                  {drawCandidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
        <ErrorMessage error={error} />
        <button
          className="btn"
          onClick={handleStartDraw}
          disabled={loading || (setupMode === 'manual' && !canStartManual)}
        >
          {loading ? 'Starting…' : setupMode === 'manual' ? 'Start Draw' : 'Seed & Start Draw'}
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

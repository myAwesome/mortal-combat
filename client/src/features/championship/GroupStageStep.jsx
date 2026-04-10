import { useState } from 'react'
import { autoFillGroupMatches, createGroups } from '../../api/championships'
import GroupCard from './GroupCard'
import ErrorMessage from '../../components/ErrorMessage'

export default function GroupStageStep({ champ, onDone, needsSetup }) {
  const [groupSize, setGroupSize] = useState(3)
  const [creating, setCreating] = useState(false)
  const [autoFilling, setAutoFilling] = useState(false)
  const [error, setError] = useState(null)

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      await createGroups(champ.id, groupSize)
      onDone()
    } catch (err) {
      setError(err)
    } finally {
      setCreating(false)
    }
  }

  const handleAutoFill = async () => {
    setAutoFilling(true)
    setError(null)
    try {
      await autoFillGroupMatches(champ.id)
      onDone()
    } catch (err) {
      setError(err)
    } finally {
      setAutoFilling(false)
    }
  }

  if (needsSetup || champ.groups.length === 0) {
    return (
      <div className="card">
        <h2 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>Create Group Stage</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {champ.players.length} players will be distributed across groups.
        </p>
        <ErrorMessage error={error} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            Optimal group size:
            <input
              type="number"
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              min="2"
              max="8"
              style={{ width: '64px' }}
            />
          </label>
          <button className="btn" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : 'Create Groups'}
          </button>
        </div>
      </div>
    )
  }

  const allDone = champ.groups.every((g) => g.matches.every((m) => m.result !== null))

  return (
    <div>
      <ErrorMessage error={error} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button className="btn btn-sm" onClick={handleAutoFill} disabled={allDone || autoFilling}>
          {autoFilling ? 'Auto Filling…' : 'Auto Fill Results'}
        </button>
      </div>
      {allDone && (
        <div style={{
          background: 'var(--color-primary-light)',
          border: '1px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          color: 'var(--color-primary)',
          fontWeight: 500,
          fontSize: '0.875rem',
        }}>
          All group matches complete. Proceed to create the playoff draw.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {champ.groups.map((g) => (
          <GroupCard key={g.name} champ={champ} group={g} onDone={onDone} />
        ))}
      </div>
    </div>
  )
}

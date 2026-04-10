import { useEffect, useMemo, useState } from 'react'
import { autoFillGroupMatches, createGroups } from '../../api/championships'
import GroupCard from './GroupCard'
import ErrorMessage from '../../components/ErrorMessage'

export default function GroupStageStep({ champ, onDone, needsSetup }) {
  const [groupSize, setGroupSize] = useState(3)
  const [setupMode, setSetupMode] = useState('auto')
  const [manualAssignments, setManualAssignments] = useState({})
  const [creating, setCreating] = useState(false)
  const [autoFilling, setAutoFilling] = useState(false)
  const [error, setError] = useState(null)

  const groupNames = useMemo(() => {
    const size = Number(groupSize)
    if (!Number.isFinite(size) || size < 2) return []
    const amount = Math.floor((champ.players?.length || 0) / size)
    const names = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    return names.slice(0, Math.max(1, amount))
  }, [champ.players, groupSize])

  useEffect(() => {
    if (setupMode !== 'manual') return
    if (groupNames.length === 0 || !Array.isArray(champ.players)) return

    const next = {}
    champ.players.forEach((player, index) => {
      next[player.id] = groupNames[index % groupNames.length]
    })
    setManualAssignments(next)
  }, [setupMode, groupNames, champ.players])

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    try {
      if (groupNames.length === 0) {
        throw new Error('Choose a smaller optimal group size.')
      }

      if (setupMode === 'manual') {
        const missing = champ.players.filter((player) => !manualAssignments[player.id])
        if (missing.length > 0) {
          throw new Error('Assign each player to a group before creating groups.')
        }

        const manualGroups = groupNames.map((name) => ({
          name,
          playerIds: champ.players
            .filter((player) => manualAssignments[player.id] === name)
            .map((player) => player.id),
        }))

        const emptyGroups = manualGroups.filter((group) => group.playerIds.length === 0)
        if (emptyGroups.length > 0) {
          throw new Error('Each group must contain at least one player.')
        }

        await createGroups(champ.id, { manualGroups })
      } else {
        await createGroups(champ.id, { optimalGroupSize: groupSize })
      }
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
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
            <input
              type="radio"
              name="group-setup-mode"
              value="auto"
              checked={setupMode === 'auto'}
              onChange={() => setSetupMode('auto')}
            />
            Automatically
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
            <input
              type="radio"
              name="group-setup-mode"
              value="manual"
              checked={setupMode === 'manual'}
              onChange={() => setSetupMode('manual')}
            />
            Manually
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: setupMode === 'manual' ? '1rem' : 0 }}>
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
        </div>
        {setupMode === 'manual' && (
          <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
            {champ.players.map((player) => (
              <div
                key={player.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(180px, 1fr) 120px',
                  gap: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '0.875rem' }}>{player.name}</div>
                <select
                  value={manualAssignments[player.id] || ''}
                  onChange={(e) => setManualAssignments((prev) => ({ ...prev, [player.id]: e.target.value }))}
                >
                  <option value="" disabled>Select group</option>
                  {groupNames.map((name) => (
                    <option key={name} value={name}>
                      Group {name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
        <button className="btn" onClick={handleCreate} disabled={creating || groupNames.length === 0}>
          {creating ? 'Creating…' : 'Create Groups'}
        </button>
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

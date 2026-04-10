import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getChampionship } from '../api/championships'
import { deriveStage, STAGES } from '../features/championship/deriveStage'
import { getMatchFormatLabel } from '../features/championship/scoreFormat'
import WorkflowStepper from '../features/championship/WorkflowStepper'
import EntryListStep from '../features/championship/EntryListStep'
import GroupStageStep from '../features/championship/GroupStageStep'
import DrawStep from '../features/championship/DrawStep'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

export default function ChampionshipDetail() {
  const { id } = useParams()
  const [champ, setChamp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(() => {
    return getChampionship(id)
      .then(setChamp)
      .catch(setError)
  }, [id])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  if (!champ) return null

  const stage = deriveStage(champ)
  const sortedByPoints = [...(champ.players || [])].sort((a, b) => (b.points || 0) - (a.points || 0))

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: '0.25rem' }}>
            <Link to="/championships" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              ← Championships
            </Link>
          </div>
          <h1>{champ.name}</h1>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            <span>Capacity: {champ.capacity}</span>
            <span>{champ.hasGroups ? 'Groups + Playoff' : 'Playoff only'}</span>
            <span>{getMatchFormatLabel(champ.setsToWin || 1)}</span>
            {champ.players?.length > 0 && (
              <span>{champ.players.length} players enrolled</span>
            )}
          </div>
        </div>
      </div>

      <WorkflowStepper stage={stage} hasGroups={champ.hasGroups} />

      {stage === STAGES.ENTRY_LIST && (
        <EntryListStep champ={champ} onDone={refresh} />
      )}

      {stage === STAGES.GROUPS_SETUP && (
        <GroupStageStep champ={champ} onDone={refresh} needsSetup />
      )}

      {stage === STAGES.GROUP_STAGE && (
        <GroupStageStep champ={champ} onDone={refresh} />
      )}

      {stage === STAGES.CREATE_DRAW && (
        <>
          {champ.hasGroups && champ.groups.length > 0 && (
            <GroupStageStep champ={champ} onDone={refresh} />
          )}
          <div style={{ marginTop: champ.groups.length > 0 ? '1.5rem' : 0 }}>
            <DrawStep champ={champ} onDone={refresh} />
          </div>
        </>
      )}

      {(stage === STAGES.START_DRAW || stage === STAGES.PLAYOFF || stage === STAGES.COMPLETE) && (
        <>
          {stage === STAGES.COMPLETE && (
            <>
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Entry List</h2>
                {champ.players?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                    {champ.players.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: '0.5rem 0.75rem',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.875rem',
                          background: 'var(--color-white)',
                        }}
                      >
                        {p.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No players in entry list.</p>
                )}
              </div>

              {champ.hasGroups && champ.groups.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <GroupStageStep champ={champ} onDone={refresh} />
                </div>
              )}
            </>
          )}

          <DrawStep champ={champ} onDone={refresh} />

          {stage === STAGES.COMPLETE && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h2 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Points</h2>
              {sortedByPoints.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '0.5rem' }}>#</th>
                      <th style={{ padding: '0.5rem' }}>Player</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByPoints.map((p, idx) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.5rem' }}>{idx + 1}</td>
                        <td style={{ padding: '0.5rem' }}>{p.name}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{p.points || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No points available.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

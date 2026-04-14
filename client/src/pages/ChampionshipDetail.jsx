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
import PlayerLink from "../components/PlayerLink.jsx";

function formatPlaceLabel(place) {
  const mod100 = place % 100
  if (mod100 >= 11 && mod100 <= 13) return `${place}th place`

  const mod10 = place % 10
  if (mod10 === 1) return `${place}st place`
  if (mod10 === 2) return `${place}nd place`
  if (mod10 === 3) return `${place}rd place`
  return `${place}th place`
}

function getRoundLossLabel(playersInRound) {
  if (playersInRound === 4) return 'S'
  if (playersInRound === 8) return 'Q'
  return `R${playersInRound}`
}

function formatDate(value) {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString()
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null
  if (startDate && endDate) return `${formatDate(startDate)} - ${formatDate(endDate)}`
  return startDate ? `${formatDate(startDate)} -` : `- ${formatDate(endDate)}`
}

function buildResultByPlayer(champ) {
  const resultByName = new Map()
  const matches = champ.draw?.matches || []

  const isRealPlayer = (name) => name && name.toLowerCase() !== 'bye'

  matches.forEach((match) => {
    const winner = match.winner?.name
    const p1 = match.player1?.name
    const p2 = match.player2?.name

    if (!isRealPlayer(winner)) return

    const loser = [p1, p2].find((name) => isRealPlayer(name) && name !== winner)

    if (match.prize === 1 && match.playersInRound > 2 && loser && !resultByName.has(loser)) {
      resultByName.set(loser, getRoundLossLabel(match.playersInRound))
    }

    if (match.prize === 1 && match.playersInRound === 2) {
      resultByName.set(winner, 'W')
      if (loser) resultByName.set(loser, 'F')
      return
    }

    if (match.prize === 3 && match.playersInRound === 2) {
      resultByName.set(winner, '3rd place')
      if (loser) resultByName.set(loser, 'S')
      return
    }

    if (match.prize > 3 && match.playersInRound === 2) {
      resultByName.set(winner, formatPlaceLabel(match.prize))
      if (loser) resultByName.set(loser, formatPlaceLabel(match.prize + 1))
    }
  })

  if (champ.hasGroups && champ.groups?.length > 0) {
    champ.groups.forEach((group) => {
      group.players.forEach((player) => {
        if (player.place > 2 && !resultByName.has(player.name)) {
          resultByName.set(player.name, 'RR')
        }
      })
    })
  }

  return resultByName
}

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
  const resultByPlayer = buildResultByPlayer(champ)
  const dateRange = formatDateRange(champ.startDate, champ.endDate)

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
            {dateRange && <span>Dates: {dateRange}</span>}
            <span>{champ.hasGroups ? 'Groups + Playoff' : 'Playoff only'}</span>
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
                      <th style={{ padding: '0.5rem' }}>Result</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByPoints.map((p, idx) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.5rem' }}>{idx + 1}</td>
                        <td style={{ padding: '0.5rem' }}><PlayerLink player={p}/></td>
                        <td style={{ padding: '0.5rem' }}>{resultByPlayer.get(p.name) || '-'}</td>
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

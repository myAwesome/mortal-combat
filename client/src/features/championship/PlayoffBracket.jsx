import { useMemo, useState } from 'react'
import { autoFillDrawMatches } from '../../api/championships'
import ErrorMessage from '../../components/ErrorMessage'
import { buildBracket } from './buildBracket'
import BracketMatch from './BracketMatch'
import './PlayoffBracket.css'

function formatPlaceLabel(place) {
  const mod100 = place % 100
  if (mod100 >= 11 && mod100 <= 13) return `${place}th Place`

  const mod10 = place % 10
  if (mod10 === 1) return `${place}st Place`
  if (mod10 === 2) return `${place}nd Place`
  if (mod10 === 3) return `${place}rd Place`
  return `${place}th Place`
}

export default function PlayoffBracket({ draw, champId, onDone, setsToWin = 1 }) {
  const [autoFilling, setAutoFilling] = useState(false)
  const [error, setError] = useState(null)
  const mainRounds = buildBracket(draw.matches, { prize: 1 })
  const thirdPlaceFinal = draw.matches.find((m) => m.prize === 3 && m.playersInRound === 2)
  const placementPrizes = useMemo(
    () =>
      [...new Set(draw.matches.filter((m) => m.prize > 3).map((m) => m.prize))]
        .sort((a, b) => a - b),
    [draw.matches]
  )
  const tabs = useMemo(
    () => [
      { key: 'main', label: 'Main Playoff', type: 'main' },
      ...placementPrizes.map((prize) => ({
        key: `p${prize}`,
        label: `${formatPlaceLabel(prize)} Playoff`,
        type: 'placement',
        prize,
      })),
    ],
    [placementPrizes]
  )
  const [activeTab, setActiveTab] = useState('main')
  const resolvedActiveTab = tabs.find((tab) => tab.key === activeTab) ?? tabs[0]
  const isComplete = draw.matches.every((m) => m.result !== null)

  const handleAutoFill = async () => {
    setAutoFilling(true)
    setError(null)
    try {
      await autoFillDrawMatches(champId)
      onDone()
    } catch (err) {
      setError(err)
    } finally {
      setAutoFilling(false)
    }
  }

  if (mainRounds.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>No bracket matches found.</p>
  }

  const renderBracketRounds = (rounds) => (
    <div className="bracket">
      {rounds.map((round, roundIdx) => (
        <div key={round.label} style={{ display: 'flex', alignItems: 'stretch' }}>
          <div className="bracket-round">
            <div className="bracket-round-header">{round.label}</div>
            {round.matches.map((match) => (
              <div key={match.id} className="bracket-match-slot">
                <BracketMatch match={match} champId={champId} onDone={onDone} setsToWin={setsToWin} />
              </div>
            ))}
          </div>
          {roundIdx < rounds.length - 1 && (
            <div className="bracket-round" style={{ justifyContent: 'space-around' }}>
              <div className="bracket-round-header" style={{ visibility: 'hidden' }}>-</div>
              {rounds[roundIdx + 1].matches.map((_, i) => (
                <div key={i} style={{ display: 'flex', flex: 1, alignItems: 'stretch' }}>
                  <div className="bracket-connector" style={{ width: '20px' }}>
                    <div className="connector-top" />
                    <div className="connector-bottom" />
                  </div>
                  <div style={{ width: '16px', alignSelf: 'center', height: '2px', background: 'var(--color-border)' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const placementRounds =
    resolvedActiveTab.type === 'placement'
      ? buildBracket(draw.matches, { prize: resolvedActiveTab.prize })
      : []

  return (
    <div>
      <div className="bracket-toolbar">
        <ErrorMessage error={error} />
        <button type="button" className="btn btn-sm" onClick={handleAutoFill} disabled={isComplete || autoFilling}>
          {autoFilling ? 'Auto Filling…' : 'Auto Fill Results'}
        </button>
      </div>
      <div className="bracket-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`bracket-tab ${resolvedActiveTab.key === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {resolvedActiveTab.type === 'main' && (
        <>
          {renderBracketRounds(mainRounds)}
          {thirdPlaceFinal && (
            <div style={{ marginTop: '1.25rem' }}>
              <div className="bracket-round-header" style={{ marginBottom: '0.5rem' }}>
                3rd Place Final
              </div>
              <BracketMatch match={thirdPlaceFinal} champId={champId} onDone={onDone} setsToWin={setsToWin} />
            </div>
          )}
        </>
      )}

      {resolvedActiveTab.type === 'placement' && (
        <>
          {renderBracketRounds(placementRounds)}
          {placementRounds.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)' }}>No bracket matches found for this place.</p>
          )}
        </>
      )}
    </div>
  )
}

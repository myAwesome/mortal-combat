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

export default function PlayoffBracket({ draw, champId, onDone }) {
  const rounds = buildBracket(draw.matches)
  const placementRoundGroups = Array.from(
    draw.matches
      .filter((m) => m.prize > 1)
      .reduce((acc, match) => {
        const key = `${match.prize}-${match.playersInRound}`
        if (!acc.has(key)) {
          acc.set(key, {
            key,
            prize: match.prize,
            playersInRound: match.playersInRound,
            stage: match.stage,
            matches: [],
          })
        }
        acc.get(key).matches.push(match)
        return acc
      }, new Map())
      .values()
  )
    .map((group) => ({
      ...group,
      matches: group.matches.sort((a, b) => a.matchNumberInRound - b.matchNumberInRound),
    }))
    .sort((a, b) => {
      if (a.prize !== b.prize) return a.prize - b.prize
      return b.playersInRound - a.playersInRound
    })

  if (rounds.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>No bracket matches found.</p>
  }

  return (
    <div>
    <div className="bracket">
      {rounds.map((round, roundIdx) => (
        <div key={round.label} style={{ display: 'flex', alignItems: 'stretch' }}>
          <div className="bracket-round">
            <div className="bracket-round-header">{round.label}</div>
            {round.matches.map((match, matchIdx) => (
              <div key={match.id} className="bracket-match-slot">
                <BracketMatch match={match} champId={champId} onDone={onDone} />
              </div>
            ))}
          </div>
          {/* Connector between rounds */}
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
    {placementRoundGroups.length > 0 && (
      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
        {placementRoundGroups.map((group) => (
          <div key={group.key}>
            <div className="bracket-round-header" style={{ marginBottom: '0.5rem' }}>
              {formatPlaceLabel(group.prize)} {group.stage}
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {group.matches.map((match) => (
                <BracketMatch key={match.id} match={match} champId={champId} onDone={onDone} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
    </div>
  )
}

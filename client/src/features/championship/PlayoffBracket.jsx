import { buildBracket } from './buildBracket'
import BracketMatch from './BracketMatch'
import './PlayoffBracket.css'

export default function PlayoffBracket({ draw, champId, onDone }) {
  const rounds = buildBracket(draw.matches)

  if (rounds.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>No bracket matches found.</p>
  }

  return (
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
  )
}

/**
 * Groups flat match array into rounds for visual bracket rendering.
 * Includes matches for a specific prize bracket.
 * Returns array of rounds ordered from first round to final.
 */
export function buildBracket(matches, options = {}) {
  const prize = options.prize ?? 1
  const bracketMatches = matches.filter((m) => m.prize === prize)

  const roundMap = new Map()
  for (const match of bracketMatches) {
    const key = match.playersInRound
    if (!roundMap.has(key)) roundMap.set(key, [])
    roundMap.get(key).push(match)
  }

  for (const roundMatches of roundMap.values()) {
    roundMatches.sort((a, b) => a.matchNumberInRound - b.matchNumberInRound)
  }

  return Array.from(roundMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([playersInRound, roundMatches]) => ({
      label: roundMatches[0]?.stage ?? String(playersInRound),
      playersInRound,
      matches: roundMatches,
    }))
}

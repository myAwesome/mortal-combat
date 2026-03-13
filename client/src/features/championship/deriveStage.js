export const STAGES = {
  ENTRY_LIST: 'ENTRY_LIST',
  GROUPS_SETUP: 'GROUPS_SETUP',
  GROUP_STAGE: 'GROUP_STAGE',
  CREATE_DRAW: 'CREATE_DRAW',
  START_DRAW: 'START_DRAW',
  PLAYOFF: 'PLAYOFF',
  COMPLETE: 'COMPLETE',
}

export const STAGE_LABELS = {
  [STAGES.ENTRY_LIST]: 'Needs Entry List',
  [STAGES.GROUPS_SETUP]: 'Needs Groups',
  [STAGES.GROUP_STAGE]: 'Group Stage',
  [STAGES.CREATE_DRAW]: 'Needs Draw',
  [STAGES.START_DRAW]: 'Draw Ready',
  [STAGES.PLAYOFF]: 'Playoff',
  [STAGES.COMPLETE]: 'Complete',
}

export function deriveStage(champ) {
  if (!champ) return null

  if (!champ.players || champ.players.length === 0) {
    return STAGES.ENTRY_LIST
  }

  if (champ.hasGroups && champ.groups.length === 0) {
    return STAGES.GROUPS_SETUP
  }

  if (champ.groups.length > 0) {
    const allGroupsDone = champ.groups.every(
      (g) => g.matches.every((m) => m.result !== null)
    )
    if (!allGroupsDone) return STAGES.GROUP_STAGE
    if (!champ.draw) return STAGES.CREATE_DRAW
  }

  if (!champ.hasGroups && !champ.draw) {
    return STAGES.CREATE_DRAW
  }

  if (champ.draw) {
    const firstRoundMatches = champ.draw.matches.filter(
      (m) => m.playersInRound === champ.draw.capacity
    )
    // If all first-round matches have null player1, draw is not seeded yet
    const isSeeded = firstRoundMatches.length === 0 || firstRoundMatches.some((m) => m.player1 !== null)
    if (!isSeeded) return STAGES.START_DRAW

    const total = champ.draw.matches.length
    if (champ.draw.completedMatches < total) return STAGES.PLAYOFF

    return STAGES.COMPLETE
  }

  return STAGES.ENTRY_LIST
}

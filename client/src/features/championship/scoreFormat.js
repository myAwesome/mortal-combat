export function getMaxSets(setsToWin = 1) {
  return Number(setsToWin) * 2 - 1
}

export function getScorePlaceholder(setsToWin = 1) {
  if (Number(setsToWin) === 1) return '6-2'
  if (Number(setsToWin) === 2) return '6-2 4-6 7-5'
  return '6-2 4-6 7-5 4-6 6-0'
}

export function getMatchFormatLabel(setsToWin = 1) {
  if (Number(setsToWin) === 1) return 'До 1 сету'
  if (Number(setsToWin) === 2) return 'До 2 сетів'
  return 'До 3 сетів'
}

export function isScoreInputShapeValid(value, setsToWin = 1) {
  const normalized = String(value || '').trim().replace(/\s+/g, ' ')
  if (!normalized) return false
  if (!/^\d+-\d+( \d+-\d+)*$/.test(normalized)) return false
  const setCount = normalized.split(' ').length
  return setCount >= Number(setsToWin) && setCount <= getMaxSets(setsToWin)
}

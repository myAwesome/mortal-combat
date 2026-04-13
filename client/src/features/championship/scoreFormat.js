export function getMaxSets(setsToWin = 1) {
  return Number(setsToWin) * 2 - 1
}

export function getScorePlaceholder(setsToWin = 1) {
  if (Number(setsToWin) === 1) return '6-2'
  if (Number(setsToWin) === 2) return '6-2 4-6 7-5'
  return '6-2 4-6 7-5 4-6 6-0'
}

export function getMatchFormatLabel(setsToWin = 1) {
  if (Number(setsToWin) === 1) return 'Best of 1'
  if (Number(setsToWin) === 2) return 'Best of 3'
  return 'Best of 5'
}

export function isScoreInputShapeValid(value, setsToWin = 1) {
  const normalized = String(value || '').trim().replace(/\s+/g, ' ')
  if (!normalized) return false
  if (!/^\d+-\d+( \d+-\d+)*$/.test(normalized)) return false
  const setCount = normalized.split(' ').length
  return setCount >= Number(setsToWin) && setCount <= getMaxSets(setsToWin)
}

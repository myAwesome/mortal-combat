const BASE = '/api/championships'

const handleResponse = async (res) => {
  if (res.ok) return res.status === 204 ? null : res.json()
  const err = await res.json().catch(() => ({ error: res.statusText }))
  return Promise.reject(err)
}

const post = (url, body = {}) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(handleResponse)

export const getChampionships = () => fetch(BASE).then(handleResponse)

export const getChampionship = (id) =>
  fetch(`${BASE}/${id}`).then(handleResponse)

export const createChampionship = (data) => post(BASE, data)

export const updateChampionship = (id, data) =>
  fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse)

export const deleteChampionship = (id) =>
  fetch(`${BASE}/${id}`, { method: 'DELETE' }).then(handleResponse)

export const setEntryList = (id, playerIds) =>
  post(`${BASE}/${id}/entry-list`, { playerIds })

export const createGroups = (id, options = {}) => {
  if (typeof options === 'number') {
    return post(`${BASE}/${id}/groups`, { optimalGroupSize: options })
  }
  return post(`${BASE}/${id}/groups`, options)
}

export const createDraw = (id) => post(`${BASE}/${id}/draw`)

export const startDraw = (id) => post(`${BASE}/${id}/draw/start`)

export const recordGroupMatch = (champId, groupName, matchId, result) =>
  fetch(`${BASE}/${champId}/groups/${groupName}/matches/${matchId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result }),
  }).then(handleResponse)

export const recordDrawMatch = (champId, matchId, result) =>
  fetch(`${BASE}/${champId}/draw/matches/${matchId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result }),
  }).then(handleResponse)

export const autoFillGroupMatches = (champId) =>
  post(`${BASE}/${champId}/groups/auto-fill`)

export const autoFillDrawMatches = (champId) =>
  post(`${BASE}/${champId}/draw/auto-fill`)

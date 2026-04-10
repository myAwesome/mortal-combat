const BASE = '/api/ligues'

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

export const getLigues = () => fetch(BASE).then(handleResponse)

export const createLigue = (name) => post(BASE, { name })

export const getLigue = (id) => fetch(`${BASE}/${id}`).then(handleResponse)

export const updateLigue = (id, name) =>
  fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).then(handleResponse)

export const deleteLigue = (id) =>
  fetch(`${BASE}/${id}`, { method: 'DELETE' }).then(handleResponse)

export const getLigueRanking = (id) =>
  fetch(`${BASE}/${id}/ranking`).then(handleResponse)

export const getLiguePlayers = (id) =>
  fetch(`${BASE}/${id}/players`).then(handleResponse)

export const addLiguePlayer = (ligueId, playerId) =>
  post(`${BASE}/${ligueId}/players`, { playerId })

export const addLiguePlayersBatch = (ligueId, playerIds) =>
  post(`${BASE}/${ligueId}/players/batch`, { playerIds })

export const removeLiguePlayer = (ligueId, lpId) =>
  fetch(`${BASE}/${ligueId}/players/${lpId}`, { method: 'DELETE' }).then(handleResponse)

export const removeLiguePlayersBatch = (ligueId, liguePlayerIds) =>
  fetch(`${BASE}/${ligueId}/players/batch`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ liguePlayerIds }),
  }).then(handleResponse)

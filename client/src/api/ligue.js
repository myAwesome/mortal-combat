const BASE = '/api/ligue'

const handleResponse = async (res) => {
  if (res.ok) return res.status === 204 ? null : res.json()
  const err = await res.json().catch(() => ({ error: res.statusText }))
  return Promise.reject(err)
}

export const getLigueRanking = () => fetch(BASE).then(handleResponse)

export const getLiguePlayers = () =>
  fetch(`${BASE}/players`).then(handleResponse)

export const addLiguePlayer = (playerId) =>
  fetch(`${BASE}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId }),
  }).then(handleResponse)

export const removeLiguePlayer = (id) =>
  fetch(`${BASE}/players/${id}`, { method: 'DELETE' }).then(handleResponse)

export const updateLiguePlayer = (id, data) =>
  fetch(`${BASE}/players/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse)

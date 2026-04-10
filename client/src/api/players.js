const BASE = '/api/players'

const handleResponse = async (res) => {
  if (res.ok) return res.status === 204 ? null : res.json()
  const err = await res.json().catch(() => ({ error: res.statusText }))
  return Promise.reject(err)
}

export const getPlayers = () => fetch(BASE).then(handleResponse)

export const getPlayer = (id) => fetch(`${BASE}/${id}`).then(handleResponse)

export const createPlayer = (name) =>
  fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).then(handleResponse)

export const updatePlayer = (id, name) =>
  fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).then(handleResponse)

export const deletePlayer = (id) =>
  fetch(`${BASE}/${id}`, { method: 'DELETE' }).then(handleResponse)

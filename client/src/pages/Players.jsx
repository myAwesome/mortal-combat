import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '../api/players'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmButton from '../components/ConfirmButton'

export default function Players() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const load = () => getPlayers().then(setPlayers).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      await createPlayer(newName.trim())
      setNewName('')
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async (id) => {
    if (!editName.trim()) return
    setError(null)
    try {
      await updatePlayer(id, editName.trim())
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err)
    }
  }

  const handleDelete = async (id) => {
    setError(null)
    try {
      await deletePlayer(id)
      await load()
    } catch (err) {
      setError(err)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>Players</h1>
      </div>

      <ErrorMessage error={error} />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Player name"
            style={{ flexGrow: 1 }}
          />
          <button type="submit" className="btn" disabled={creating || !newName.trim()}>
            {creating ? 'Adding…' : 'Add Player'}
          </button>
        </form>
      </div>

      <div className="card">
        {players.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>No players yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--color-text-muted)', width: '60px' }}>{p.id}</td>
                  <td>
                    {editingId === p.id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleEdit(p.id) }}
                        style={{ display: 'flex', gap: '0.4rem' }}
                      >
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          style={{ width: '200px' }}
                        />
                        <button type="submit" className="btn btn-sm">Save</button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <Link to={`/players/${p.id}`} style={{ fontWeight: 500 }}>
                        {p.name}
                      </Link>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {editingId !== p.id && (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ marginRight: '0.5rem' }}
                          onClick={() => { setEditingId(p.id); setEditName(p.name) }}
                        >
                          Edit
                        </button>
                        <ConfirmButton onConfirm={() => handleDelete(p.id)}>
                          Delete
                        </ConfirmButton>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

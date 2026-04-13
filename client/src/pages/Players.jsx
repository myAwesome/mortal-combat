import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '../api/players'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmButton from '../components/ConfirmButton'

const PAGE_SIZE = 10

export default function Players() {
  const [players, setPlayers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE
  const searchValue = search.trim()
  const isSearchActive = searchValue.length >= 3

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getPlayers({
        limit: PAGE_SIZE,
        offset: (currentPage - 1) * PAGE_SIZE,
        search: isSearchActive ? searchValue : undefined,
      })
      setPlayers(result.items || [])
      setTotal(Number(result.total || 0))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, isSearchActive, searchValue])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [page, currentPage])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
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
    try {
      await updatePlayer(id, editName.trim())
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err)
    }
  }

  const handleDelete = async (id) => {
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

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search players"
          style={{ width: '100%' }}
        />
      </div>

      <div className="card">
        {total === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>
            {isSearchActive ? 'No players found.' : 'No players yet.'}
          </p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id}>
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

            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Showing {start + 1}-{Math.min(start + players.length, total)} of {total}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || players.length === 0}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

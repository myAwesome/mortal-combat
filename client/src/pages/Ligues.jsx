import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLigues, createLigue, deleteLigue } from '../api/ligues'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmButton from '../components/ConfirmButton'

export default function Ligues() {
  const [ligues, setLigues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const load = () => getLigues().then(setLigues).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    try {
      await createLigue(name.trim())
      setName('')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    setError(null)
    try {
      await deleteLigue(id)
      await load()
    } catch (err) {
      setError(err)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>Ligues</h1>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New Ligue'}
        </button>
      </div>

      <ErrorMessage error={error} />

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1rem' }}>New Ligue</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Premier League"
              style={{ width: '240px' }}
              autoFocus
            />
            <button type="submit" className="btn" disabled={creating || !name.trim()}>
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {ligues.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>No ligues yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ligues.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link to={`/ligues/${l.id}`} style={{ fontWeight: 500 }}>
                      {l.name}
                    </Link>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <ConfirmButton onConfirm={() => handleDelete(l.id)}>
                      Delete
                    </ConfirmButton>
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

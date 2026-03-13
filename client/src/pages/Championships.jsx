import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getChampionships, createChampionship, deleteChampionship } from '../api/championships'
import { deriveStage, STAGE_LABELS } from '../features/championship/deriveStage'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmButton from '../components/ConfirmButton'
import StatusBadge from '../components/StatusBadge'

export default function Championships() {
  const [champs, setChamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', capacity: '', hasGroups: true })
  const [creating, setCreating] = useState(false)

  const load = () => getChampionships().then(setChamps).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.capacity) return
    setCreating(true)
    setError(null)
    try {
      await createChampionship({
        name: form.name.trim(),
        capacity: Number(form.capacity),
        hasGroups: form.hasGroups,
      })
      setForm({ name: '', capacity: '', hasGroups: true })
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
      await deleteChampionship(id)
      await load()
    } catch (err) {
      setError(err)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="page-header">
        <h1>Championships</h1>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : '+ New Championship'}
        </button>
      </div>

      <ErrorMessage error={error} />

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1rem' }}>New Championship</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                NAME
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Roland Garros"
                style={{ width: '220px' }}
                autoFocus
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                CAPACITY
              </label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                placeholder="8"
                min="2"
                style={{ width: '90px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingBottom: '2px' }}>
              <input
                type="checkbox"
                id="hasGroups"
                checked={form.hasGroups}
                onChange={(e) => setForm((f) => ({ ...f, hasGroups: e.target.checked }))}
              />
              <label htmlFor="hasGroups" style={{ fontSize: '0.875rem' }}>Group stage</label>
            </div>
            <button
              type="submit"
              className="btn"
              disabled={creating || !form.name.trim() || !form.capacity}
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {champs.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '1rem 0' }}>No championships yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Capacity</th>
                <th>Format</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {champs.map((c) => {
                const stage = deriveStage(c)
                return (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/championships/${c.id}`} style={{ fontWeight: 500 }}>
                        {c.name}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{c.capacity}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      {c.hasGroups ? 'Groups + Playoff' : 'Playoff only'}
                    </td>
                    <td>
                      <StatusBadge status={STAGE_LABELS[stage] || stage} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ConfirmButton onConfirm={() => handleDelete(c.id)}>
                        Delete
                      </ConfirmButton>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

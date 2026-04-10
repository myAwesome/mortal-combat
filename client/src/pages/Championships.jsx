import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getChampionships, createChampionship, deleteChampionship } from '../api/championships'
import { getLigues } from '../api/ligues'
import { deriveStage, STAGE_LABELS } from '../features/championship/deriveStage'
import { getMatchFormatLabel } from '../features/championship/scoreFormat'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import ConfirmButton from '../components/ConfirmButton'
import StatusBadge from '../components/StatusBadge'

const PLAYOFF_STAGE_LABELS = {
  1: 'Winner',
  2: 'Runner-up (lost final)',
  4: 'Lost semi-final',
  8: 'Lost quarter-final',
  16: 'Lost Round of 16',
  32: 'Lost Round of 32',
  64: 'Lost Round of 64',
  128: 'Lost Round of 128',
}

const DEFAULT_PLAYOFF_POINTS = { 1: 2000, 2: 1200, 4: 720, 8: 360, 16: 180, 32: 90, 64: 45 }
const DEFAULT_GROUP_POINTS = { 1: 0, 2: 0, 3: 90, 4: 45 }

function buildDefaultPointsConfig(capacity) {
  const playoff = { 1: DEFAULT_PLAYOFF_POINTS[1] ?? 2000 }
  let stage = 2
  while (stage <= capacity) {
    playoff[stage] = DEFAULT_PLAYOFF_POINTS[stage] ?? 0
    stage *= 2
  }
  return { playoff, group: { ...DEFAULT_GROUP_POINTS } }
}

function getPlayoffStages(capacity) {
  const stages = [1]
  let s = 2
  while (s <= capacity) { stages.push(s); s *= 2 }
  return stages
}

function PointsConfigForm({ capacity, hasGroups, value, onChange }) {
  const stages = getPlayoffStages(capacity)

  const setPlayoff = (stage, pts) => {
    onChange({ ...value, playoff: { ...value.playoff, [stage]: Number(pts) } })
  }
  const setGroup = (place, pts) => {
    onChange({ ...value, group: { ...value.group, [place]: Number(pts) } })
  }

  return (
    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
        Points per result
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
        {stages.map((stage) => (
          <label key={stage} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ flex: 1, color: 'var(--color-text-muted)' }}>{PLAYOFF_STAGE_LABELS[stage] ?? `Stage ${stage}`}</span>
            <input
              type="number"
              min="0"
              value={value.playoff[stage] ?? 0}
              onChange={(e) => setPlayoff(stage, e.target.value)}
              style={{ width: '72px' }}
            />
          </label>
        ))}
        {hasGroups && [3, 4].map((place) => (
          <label key={`g${place}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ flex: 1, color: 'var(--color-text-muted)' }}>Group place {place}</span>
            <input
              type="number"
              min="0"
              value={value.group[place] ?? 0}
              onChange={(e) => setGroup(place, e.target.value)}
              style={{ width: '72px' }}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

const emptyForm = { name: '', capacity: '', hasGroups: false, setsToWin: 2, ligueId: '', pointsConfig: null }

export default function Championships() {
  const [champs, setChamps] = useState([])
  const [ligues, setLigues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)

  const load = () =>
    Promise.all([getChampionships(), getLigues()])
      .then(([c, l]) => { setChamps(c); setLigues(l) })
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  // Recompute points config when capacity or ligue changes
  useEffect(() => {
    if (form.ligueId && form.capacity) {
      setForm((f) => ({ ...f, pointsConfig: buildDefaultPointsConfig(Number(f.capacity)) }))
    }
  }, [form.capacity, form.hasGroups, form.ligueId])

  const handleLigueChange = (ligueId) => {
    const config = ligueId && form.capacity
      ? buildDefaultPointsConfig(Number(form.capacity))
      : null
    setForm((f) => ({ ...f, ligueId, pointsConfig: config }))
  }

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
        setsToWin: Number(form.setsToWin),
        ligueId: form.ligueId ? Number(form.ligueId) : null,
        pointsConfig: form.pointsConfig,
      })
      setForm(emptyForm)
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

  const ligueMap = new Map(ligues.map((l) => [String(l.id), l.name]))

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
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
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
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  LIGUE
                </label>
                <select
                  value={form.ligueId}
                  onChange={(e) => handleLigueChange(e.target.value)}
                  style={{ width: '180px' }}
                >
                  <option value="">— No ligue —</option>
                  {ligues.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="btn"
                disabled={creating || !form.name.trim() || !form.capacity}
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>

            <details style={{ marginTop: '0.75rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Advanced settings
              </summary>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingBottom: '2px' }}>
                  <input
                    type="checkbox"
                    id="hasGroups"
                    checked={form.hasGroups}
                    onChange={(e) => setForm((f) => ({ ...f, hasGroups: e.target.checked }))}
                  />
                  <label htmlFor="hasGroups" style={{ fontSize: '0.875rem' }}>Group stage</label>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    MATCH FORMAT
                  </label>
                  <select
                    value={form.setsToWin}
                    onChange={(e) => setForm((f) => ({ ...f, setsToWin: Number(e.target.value) }))}
                    style={{ width: '150px' }}
                  >
                    <option value={1}>До 1 сету</option>
                    <option value={2}>До 2 сетів</option>
                    <option value={3}>До 3 сетів</option>
                  </select>
                </div>
              </div>
            </details>

            {form.ligueId && form.capacity && form.pointsConfig && (
              <PointsConfigForm
                capacity={Number(form.capacity)}
                hasGroups={form.hasGroups}
                value={form.pointsConfig}
                onChange={(cfg) => setForm((f) => ({ ...f, pointsConfig: cfg }))}
              />
            )}
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
                <th>Ligue</th>
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
                      {(c.hasGroups ? 'Groups + Playoff' : 'Playoff only')}
                      <span style={{ marginLeft: '0.4rem' }}>• {getMatchFormatLabel(c.setsToWin || 1)}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {c.ligueId
                        ? <Link to={`/ligues/${c.ligueId}`}><StatusBadge status={ligueMap.get(String(c.ligueId)) || 'Ligue'} /></Link>
                        : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      }
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

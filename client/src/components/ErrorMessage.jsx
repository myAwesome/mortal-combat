export default function ErrorMessage({ error }) {
  if (!error) return null
  const msg = typeof error === 'string' ? error : (error.error || error.message || 'An error occurred')
  return (
    <div style={{
      background: 'var(--color-danger-light)',
      border: '1px solid var(--color-danger)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--color-danger)',
      padding: '0.6rem 1rem',
      fontSize: '0.875rem',
      marginBottom: '1rem',
    }}>
      {msg}
    </div>
  )
}

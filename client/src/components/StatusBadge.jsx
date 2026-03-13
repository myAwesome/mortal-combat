const COLORS = {
  Complete: { bg: '#e8f5e9', color: '#2c7a3a' },
  Playoff: { bg: '#e3f2fd', color: '#1565c0' },
  'Group Stage': { bg: '#fff3e0', color: '#e65100' },
  default: { bg: '#f1f5f9', color: '#64748b' },
}

export default function StatusBadge({ status }) {
  const style = COLORS[status] || COLORS.default
  return (
    <span style={{
      ...style,
      display: 'inline-block',
      padding: '0.2rem 0.65rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

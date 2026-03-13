import { useState } from 'react'

export default function ConfirmButton({ onConfirm, children, className = 'btn btn-danger btn-sm', disabled }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Sure?</span>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => { setConfirming(false); onConfirm() }}
        >
          Yes
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setConfirming(false)}
        >
          No
        </button>
      </span>
    )
  }

  return (
    <button
      className={className}
      onClick={() => setConfirming(true)}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

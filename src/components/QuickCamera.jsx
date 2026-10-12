import { useRef, useState } from 'react'
import { saveMediaEntries } from '../lib/journalSave'

// One-tap camera: a round button that opens the phone's own camera straight
// away and saves the shot as today's memory the moment she comes back. No
// form in between — the note is offered afterwards, not demanded first.
//   onSaved({ id, blob, createdAt }) — the entry just written
export default function QuickCamera({ onSaved, hidden = false }) {
  const inputRef = useRef(null)
  const [saving, setSaving] = useState(false)

  async function handleChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || saving) return
    setSaving(true)
    try {
      const [saved] = await saveMediaEntries([file], '')
      onSaved?.(saved)
    } finally {
      setSaving(false)
    }
  }

  if (hidden) return null
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <button
        aria-label="Take a photo"
        disabled={saving}
        onClick={() => inputRef.current?.click()}
        style={{
          position: 'fixed',
          // Sits above the tab bar, inside the 480px column on wide screens.
          bottom: 'calc(72px + 14px + env(safe-area-inset-bottom))',
          right: 'max(16px, calc(50% - 240px + 16px))',
          width: '58px', height: '58px', borderRadius: '50%', border: 'none',
          background: saving ? '#c4b5fd' : 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
          color: '#fff', fontSize: '26px', lineHeight: 1, cursor: 'pointer',
          boxShadow: '0 8px 20px rgba(124,111,247,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 90, fontFamily: 'inherit',
          transition: 'transform 0.15s ease, background 0.2s ease',
          transform: saving ? 'scale(0.92)' : 'none',
        }}
      >
        {saving ? '…' : '📷'}
      </button>
    </>
  )
}

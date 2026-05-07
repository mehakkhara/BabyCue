import { useEffect, useState } from 'react'
import { getEntries, addEntry, deleteEntry, compressImage } from '../data/journalStore'

function formatDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function EntryCard({ entry, onDelete }) {
  const [photoUrl, setPhotoUrl] = useState(null)

  useEffect(() => {
    if (!entry.photoBlob) return
    const url = URL.createObjectURL(entry.photoBlob)
    setPhotoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [entry.photoBlob])

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      marginBottom: '14px',
    }}>
      {photoUrl && (
        <img src={photoUrl} alt="" style={{
          width: '100%',
          display: 'block',
          maxHeight: '420px',
          objectFit: 'cover',
        }} />
      )}
      <div style={{ padding: '14px 16px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#888', fontWeight: 500 }}>
          {formatDate(entry.createdAt)}
        </p>
        {entry.note && (
          <p style={{ margin: '6px 0 0', fontSize: '15px', color: '#1a1a2e', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {entry.note}
          </p>
        )}
        <button
          onClick={() => {
            if (confirm('Delete this memory?')) onDelete(entry.id)
          }}
          style={{
            marginTop: '10px',
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: '#c44',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function AddForm({ onSave, onCancel }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function handleSave() {
    if (!file && !note.trim()) return
    setSaving(true)
    try {
      let photoBlob = null
      let photoType = null
      if (file) {
        photoBlob = await compressImage(file)
        photoType = 'image/jpeg'
      }
      await addEntry({ note: note.trim(), photoBlob, photoType })
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }}>
      <label
        htmlFor="journal-photo-input"
        style={{
          display: 'block',
          border: '2px dashed #d4d8e3',
          borderRadius: '12px',
          padding: previewUrl ? 0 : '32px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '12px',
          overflow: 'hidden',
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="preview" style={{ width: '100%', display: 'block', maxHeight: '320px', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: '#888', fontSize: '14px' }}>Tap to add a photo</span>
        )}
      </label>
      <input
        id="journal-photo-input"
        type="file"
        accept="image/*"
        onChange={e => setFile(e.target.files?.[0] || null)}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />

      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Add a note... (optional)"
        rows={3}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          border: '1.5px solid #E5E7EB',
          fontSize: '14px',
          resize: 'vertical',
          fontFamily: 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: '12px',
        }}
      />

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '10px',
            border: '1.5px solid #E5E7EB',
            backgroundColor: '#fff',
            color: '#555',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || (!file && !note.trim())}
          style={{
            flex: 2,
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: (file || note.trim()) && !saving ? '#7C3AED' : '#E5E7EB',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: (file || note.trim()) && !saving ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving...' : 'Save memory'}
        </button>
      </div>
    </div>
  )
}

export default function JournalScreen() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  async function refresh() {
    const list = await getEntries()
    setEntries(list)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function handleDelete(id) {
    await deleteEntry(id)
    refresh()
  }

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      minHeight: '100vh',
      backgroundColor: '#FAFAFA',
    }}>
      <div style={{
        padding: '20px 20px 16px',
        backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: '0 0 2px', fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>
            Journal
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
            {entries.length} {entries.length === 1 ? 'memory' : 'memories'}
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: '#7C3AED',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Add
          </button>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        {adding && (
          <AddForm
            onSave={() => { setAdding(false); refresh() }}
            onCancel={() => setAdding(false)}
          />
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginTop: '40px' }}>
            Loading...
          </p>
        ) : entries.length === 0 && !adding ? (
          <div style={{ textAlign: 'center', marginTop: '60px', padding: '0 24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📷</div>
            <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.5, margin: 0 }}>
              Save a memory of your baby — a photo, a note, a tiny moment to look back on.
            </p>
            <button
              onClick={() => setAdding(true)}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                borderRadius: '24px',
                border: 'none',
                backgroundColor: '#7C3AED',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add your first memory
            </button>
          </div>
        ) : (
          entries.map(entry => (
            <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  )
}

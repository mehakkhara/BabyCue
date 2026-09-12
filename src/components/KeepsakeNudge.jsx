// "Saved — make it a card?" A small strip shown right after a photo lands in
// the journal, while the moment is still warm. Same strip on Home and Journal.
export default function KeepsakeNudge({ url, onMake, onDismiss, style }) {
  return (
    <div style={{
      padding: '9px 10px',
      background: '#fdf2f8', border: '1.5px solid #fbcfe8', borderRadius: '12px',
      display: 'flex', alignItems: 'center', gap: '10px',
      ...style,
    }}>
      <img
        src={url}
        alt=""
        style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a2e' }}>Saved to the journal ✓</div>
        <div style={{ fontSize: '11px', color: '#888' }}>Make it a keepsake card?</div>
      </div>
      <button
        onClick={onMake}
        style={{
          border: 'none', background: 'none', padding: '4px 2px',
          color: '#db2777', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        Make it →
      </button>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{ border: 'none', background: 'none', color: '#c4c4d4', fontSize: '15px', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  )
}

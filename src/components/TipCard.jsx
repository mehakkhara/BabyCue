const styleColors = {
  gentle: { bg: '#FFF0F5', badge: '#E91E8C', label: 'Gentle' },
  schedule: { bg: '#F0F4FF', badge: '#3B5BDB', label: 'Schedule-Based' },
}

export default function TipCard({ title, body, style, source }) {
  const colors = styleColors[style] || styleColors.gentle

  return (
    <div style={{
      backgroundColor: colors.bg,
      borderRadius: '12px',
      padding: '16px 18px',
      marginBottom: '12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1a2e' }}>{title}</h3>
        <span style={{
          backgroundColor: colors.badge,
          color: '#fff',
          fontSize: '11px',
          fontWeight: '600',
          padding: '3px 8px',
          borderRadius: '20px',
          whiteSpace: 'nowrap',
          marginLeft: '10px',
        }}>
          {colors.label}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#444' }}>{body}</p>
      <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#888' }}>Source: {source}</p>
    </div>
  )
}

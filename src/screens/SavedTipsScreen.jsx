// Her bookmarked tips, on their own page (reached from Profile).
import { useState } from 'react'
import { loadSaved, removeSaved } from '../lib/savedTips'
import { personalize } from '../lib/pronouns'
import { Screen, Card } from '../components/ui'
import { color, type } from '../theme'

export default function SavedTipsScreen({ profile, onBack, onOpenTip }) {
  const [saved, setSaved] = useState(() => loadSaved())

  return (
    <Screen onBack={onBack} detail title="Saved tips" subtitle={saved.length === 0 ? 'Bookmark a tip and it lives here.' : `${saved.length} ${saved.length === 1 ? 'tip' : 'tips'} you wanted to keep`}>
      {saved.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 10px', color: color.faint }}>
          <div style={{ fontSize: '34px', marginBottom: '8px' }}>🔖</div>
          <p style={type.body}>Tap the bookmark on any tip to save it for later.</p>
        </div>
      ) : (
        saved.map(t => (
          <Card key={String(t.id)} style={{ marginBottom: '10px' }} padding="14px 16px" onClick={() => onOpenTip?.(t)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
              <p style={{ ...type.bodyStrong, fontSize: '14px', marginBottom: '4px' }}>{personalize(t.title, profile)}</p>
              <span
                role="button"
                aria-label="Remove from saved"
                onClick={e => { e.stopPropagation(); setSaved(removeSaved(t.id)) }}
                style={{ color: color.lavender, fontSize: '15px', cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}
              >
                ✕
              </span>
            </div>
            <p style={{ ...type.body, fontSize: '13px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {personalize(t.body, profile)}
            </p>
            {t.source && <p style={{ ...type.small, marginTop: '6px', color: color.lavender }}>Source: {t.source}</p>}
          </Card>
        ))
      )}
    </Screen>
  )
}

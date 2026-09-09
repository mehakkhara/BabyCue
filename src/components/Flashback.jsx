import { useEffect, useState } from 'react'
import { getEntries, isVideoType, isKeepsake } from '../data/journalStore'
import { nameAndAgeAt } from '../lib/babyAge'

const DAY_MS = 86400000
const WINDOW_DAYS = 3

// A memory from a whole number of months ago (same day-of-month, ±3 days).
// Prefers the most recent anniversary — "one month ago" hits harder than
// "seven months ago" — and, within a window, the entry closest to the exact
// date (ties go to one with a note). Returns { entry, monthsAgo } or null.
export function pickFlashback(entries, now = new Date()) {
  const withMedia = entries.filter(e => e.photoBlob && !isKeepsake(e))
  if (withMedia.length === 0) return null
  for (let m = 1; m <= 24; m++) {
    const target = new Date(now.getFullYear(), now.getMonth() - m, now.getDate()).getTime()
    const candidates = withMedia
      .map(e => ({ e, dist: Math.abs(e.createdAt - target) }))
      .filter(c => c.dist <= WINDOW_DAYS * DAY_MS)
      .sort((a, b) => (a.dist - b.dist) || (b.e.note ? 1 : 0) - (a.e.note ? 1 : 0))
    if (candidates.length > 0) return { entry: candidates[0].e, monthsAgo: m }
  }
  return null
}

// "One month ago today" — the journal quietly paying the mom back for the
// photos she's added. Rendered only when a real anniversary match exists,
// so its appearance is itself the surprise.
export default function Flashback({ profile, onOpenJournal }) {
  const [match, setMatch] = useState(null)
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl = null
    ;(async () => {
      try {
        const entries = await getEntries()
        const found = pickFlashback(entries)
        if (cancelled || !found) return
        objectUrl = URL.createObjectURL(found.entry.photoBlob)
        setMatch(found)
        setUrl(objectUrl)
      } catch { /* no flashback today — the card just doesn't render */ }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [])

  if (!match || !url) return null
  const { entry, monthsAgo } = match
  const agoLabel = monthsAgo === 1 ? 'One month ago today' : `${monthsAgo} months ago today`

  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      marginBottom: '14px',
      boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
      borderLeft: '4px solid #f472b6',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 18px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📆</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#db2777', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {agoLabel}
          </span>
        </div>
      </div>

      <button
        onClick={onOpenJournal}
        style={{
          display: 'block',
          width: '100%',
          padding: 0,
          border: 'none',
          background: '#000',
          cursor: onOpenJournal ? 'pointer' : 'default',
          position: 'relative',
          textAlign: 'left',
        }}
      >
        {isVideoType(entry.photoType) ? (
          <video
            src={url}
            muted
            playsInline
            autoPlay
            loop
            style={{ width: '100%', display: 'block', maxHeight: '280px', objectFit: 'cover' }}
          />
        ) : (
          <img
            src={url}
            alt=""
            style={{ width: '100%', display: 'block', maxHeight: '280px', objectFit: 'cover' }}
          />
        )}
        <div style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          padding: '26px 16px 12px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.65))',
          color: '#fff',
        }}>
          {entry.note && (
            <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 600, lineHeight: 1.4 }}>
              {entry.note}
            </p>
          )}
          {profile?.dateOfBirth && (
            <p style={{ margin: 0, fontSize: '11px', opacity: 0.9 }}>
              {nameAndAgeAt(profile.babyName, profile.dateOfBirth, entry.createdAt)} · look how far you've both come 💜
            </p>
          )}
        </div>
      </button>
    </div>
  )
}

import { useMemo } from 'react'

const CONFETTI_COLORS = ['#7C6FF7', '#f472b6', '#fbbf24', '#34d399', '#a78bfa']

// Decorative celebration overlay: a confetti rain or a small heart fan.
// The parent owns the lifetime — render while celebrating, unmount when done.
// The parent container must be position:relative; the overlay never captures taps.
export default function Burst({ kind = 'confetti' }) {
  const pieces = useMemo(() => {
    if (kind === 'hearts') {
      return [[-34, -44], [0, -56], [34, -44]].map(([dx, dy], i) => ({ id: i, dx, dy, delay: i * 0.05 }))
    }
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 0.3,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }))
  }, [kind])

  if (kind === 'hearts') {
    return (
      <span aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {pieces.map(p => (
          <span
            key={p.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              fontSize: '14px',
              opacity: 0,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              animation: `heartFly 0.7s ease-out ${p.delay}s forwards`,
            }}
          >
            💜
          </span>
        ))}
      </span>
    )
  }

  return (
    <span aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 'inherit' }}>
      {pieces.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-12px',
            left: `${p.left}%`,
            width: '7px',
            height: '10px',
            borderRadius: '2px',
            background: p.color,
            animation: `confettiFall 1.2s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </span>
  )
}

import PaintingCanvas from './PaintingCanvas'

// One scene-specific motion when a page appears, then the picture is still.
// Each scene gets its own moment so turning pages feels like a different
// picture waking up, never the same zoom. `wind` also leans the artwork.
const EFFECTS = {
  appleTree: { moment: 'leaves', wind: 'sway' },
  bearMouse: { moment: 'leaves', wind: 'gust' },
  robinMeadow: { moment: 'bird', wind: 'sway' },
  rabbitBurrow: { moment: 'petals', wind: 'sway' },
  farmMorning: { moment: 'sunrise' },
  windowsillSprout: { moment: 'sprout' },
  moonCloud: { moment: 'cloud' },
  pondDucks: { moment: 'ripple' },
  frogLilypads: { moment: 'ripple' },
  otterStream: { moment: 'ripple' },
  bathDuck: { moment: 'bubbles' },
  cosyBedroom: { moment: 'glow' },
  bedroom: { moment: 'glow' },
  cafe: { moment: 'glow' },
  starry: { moment: 'twinkle' },
  rhone: { moment: 'twinkle' },
  harvest: { moment: 'grain', wind: 'sway' },
  cypress: { moment: 'grain', wind: 'gust' },
}
const DEFAULT_EFFECT = { moment: 'petals', wind: 'sway' }

const FALLING = new Set(['leaves', 'petals', 'grain'])

export default function StoryArt({ id, page, alt, style = {}, fit = 'cover' }) {
  const { moment, wind } = EFFECTS[id] || DEFAULT_EFFECT
  const classes = ['story-art', wind && `story-art--${wind}`, FALLING.has(moment) && `story-art--${moment}`]
    .filter(Boolean).join(' ')

  // Remount on every turn so the moment plays once for every story page.
  return (
    <div key={`${id}-${page}`} className={classes} style={style} aria-label={alt}>
      <PaintingCanvas id={id} alt={alt} fit={fit} style={{ background: '#10131f' }} />
      <div className="story-art__moment" aria-hidden="true">
        <Moment kind={moment} />
      </div>
    </div>
  )
}

function Moment({ kind }) {
  switch (kind) {
    case 'leaves': case 'petals': case 'grain':
      return many(8, i => <span key={i} className={`story-art__leaf story-art__leaf--${i}`} />)
    case 'ripple':
      return many(3, i => <span key={i} className={`story-art__ripple story-art__ripple--${i}`} />)
    case 'bubbles':
      return many(6, i => <span key={i} className={`story-art__bubble story-art__bubble--${i}`} />)
    case 'twinkle':
      return many(6, i => <span key={i} className={`story-art__star story-art__star--${i}`}>✦</span>)
    case 'sprout':
      return <span className="story-art__sprout"><i /></span>
    case 'glow':
      return <span className="story-art__glow" />
    case 'sunrise':
      return <span className="story-art__sunrise" />
    case 'bird':
      return <span className="story-art__bird" />
    case 'cloud':
      return <span className="story-art__cloud" />
    default:
      return null
  }
}

function many(n, render) {
  return <>{Array.from({ length: n }, (_, i) => render(i))}</>
}

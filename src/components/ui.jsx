// The shared UI kit. Small, composable pieces that every screen builds from
// so the app reads as one thing: same cards, same rows, same buttons.
import { color, tile, radius, shadow, gradient, type, space } from '../theme'

// Page frame. Root tabs pass `tab`; detail pages pass `onBack` (the tab bar
// is hidden by App, so the frame owns its own top bar).
export function Screen({ children, onBack, actions, title, subtitle, detail = false, padding = true, style }) {
  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      minHeight: '100vh',
      padding: padding ? `${space.pageTop} ${space.page} ${detail ? '32px' : space.navGap}` : 0,
      background: detail ? color.paper : undefined,
      ...style,
    }}>
      {(onBack || actions) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', minHeight: '36px' }}>
          {onBack ? <BackButton onClick={onBack} /> : <span />}
          {actions && <div style={{ display: 'flex', gap: '6px' }}>{actions}</div>}
        </div>
      )}
      {title && (
        <div style={{ marginBottom: subtitle ? '18px' : '14px' }}>
          <h1 style={type.h1}>{title}</h1>
          {subtitle && <p style={{ ...type.body, marginTop: '4px' }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

export function BackButton({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Back" style={{
      width: '36px', height: '36px', borderRadius: '12px', border: 'none',
      background: color.surface, boxShadow: shadow.card, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: color.ink,
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}

// Square icon button for a page's top-right corner (bookmark, share, search).
export function IconButton({ onClick, label, children, active = false }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} style={{
      width: '36px', height: '36px', borderRadius: '12px', border: 'none',
      background: active ? color.tint : color.surface, boxShadow: shadow.card, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: active ? color.primary : color.ink, fontSize: '16px',
    }}>
      {children}
    </button>
  )
}

export function Card({ children, style, onClick, padding = '18px' }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left',
      background: color.surface, borderRadius: `${radius.card}px`, padding,
      boxShadow: shadow.card, border: 'none', cursor: onClick ? 'pointer' : 'default',
      fontFamily: 'inherit', color: 'inherit',
      ...style,
    }}>
      {children}
    </Tag>
  )
}

// Rounded square with an emoji or glyph on a tinted background.
export function IconTile({ emoji, hue = 'lavender', size = 44, style }) {
  const t = tile[hue] || tile.lavender
  return (
    <span aria-hidden="true" style={{
      width: size, height: size, borderRadius: Math.round(size * 0.32), flexShrink: 0,
      background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.45), lineHeight: 1, ...style,
    }}>
      {emoji}
    </span>
  )
}

// Icon tile + title + subtitle + chevron. The building block of Today.
export function ListRow({ emoji, hue, title, subtitle, onClick, right, last = false, trailing }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
      padding: '12px 4px', border: 'none', background: 'transparent', cursor: 'pointer',
      textAlign: 'left', fontFamily: 'inherit',
      borderBottom: last ? 'none' : `1px solid ${color.hairline}`,
    }}>
      <IconTile emoji={emoji} hue={hue} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ ...type.bodyStrong, display: 'block' }}>{title}</span>
        {subtitle && (
          <span style={{ ...type.small, display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subtitle}
          </span>
        )}
      </span>
      {trailing}
      {right !== null && (right ?? <Chevron />)}
    </button>
  )
}

export function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color.lavender} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function Pill({ children, tone = 'tint', style }) {
  const tones = {
    tint:    { background: color.tint, color: color.primary },
    neutral: { background: '#f1f0f7', color: color.muted },
    success: { background: color.successBg, color: color.success },
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '5px 10px', borderRadius: radius.pill, fontSize: '12px', fontWeight: 600,
      ...tones[tone], ...style,
    }}>
      {children}
    </span>
  )
}

export function PrimaryButton({ children, onClick, disabled = false, style, done = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '15px', border: 'none', borderRadius: `${radius.button}px`,
      background: done ? color.successBg : disabled ? color.lavender : gradient.primary,
      color: done ? color.success : '#fff', fontSize: '15px', fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: done || disabled ? 'none' : shadow.button,
      fontFamily: 'inherit', transition: 'background 0.15s', ...style,
    }}>
      {children}
    </button>
  )
}

export function SecondaryButton({ children, onClick, style, active = false }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '13px', borderRadius: `${radius.button}px`,
      border: `1.5px solid ${active ? color.lavender : '#E6E3F0'}`,
      background: active ? color.tint : color.surface, color: active ? color.primary : color.ink,
      fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', ...style,
    }}>
      {children}
    </button>
  )
}

// One line of metadata: small tinted icon + text. Stacks well.
export function InfoRow({ emoji, hue = 'lavender', title, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '7px 0' }}>
      <IconTile emoji={emoji} hue={hue} size={30} />
      <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
        {title && <p style={{ ...type.bodyStrong, fontSize: '14px' }}>{title}</p>}
        {text && <p style={{ ...type.body, fontSize: '13px', marginTop: title ? '2px' : 0 }}>{text}</p>}
      </div>
    </div>
  )
}

export function SectionHeader({ title, action, onAction, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '22px 2px 10px', ...style }}>
      <h3 style={type.h3}>{title}</h3>
      {action && (
        <button onClick={onAction} style={{ border: 'none', background: 'none', color: color.primary, fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          {action}
        </button>
      )}
    </div>
  )
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
      {options.map(o => {
        const on = o.value === value
        return (
          <button key={String(o.value)} onClick={() => onChange(o.value)} style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: radius.pill, border: 'none',
            background: on ? color.primary : color.surface, color: on ? '#fff' : color.muted,
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: on ? shadow.button : shadow.card,
          }}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function StatTile({ emoji, value, label }) {
  return (
    <div style={{
      flex: '1 0 0', minWidth: 0, background: color.surface, borderRadius: '18px', padding: '14px 6px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', boxShadow: shadow.card,
    }}>
      <span style={{ fontSize: '20px' }}>{emoji}</span>
      <span style={{ fontSize: '12px', fontWeight: 700, color: color.ink, textAlign: 'center', lineHeight: 1.2 }}>{value}</span>
      <span style={{ fontSize: '10px', color: color.faint, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </div>
  )
}

// Round photo or initial. Used for the mom in the Today header.
export function Avatar({ src, name, size = 40, onClick, label }) {
  const initial = (name || '?').trim()[0]?.toUpperCase() || '?'
  return (
    <button onClick={onClick} aria-label={label || name} style={{
      width: size, height: size, borderRadius: '50%', border: '2px solid #fff', padding: 0,
      background: src ? `center / cover no-repeat url(${src})` : gradient.primary,
      color: '#fff', fontSize: Math.round(size * 0.42), fontWeight: 700,
      boxShadow: shadow.card, cursor: onClick ? 'pointer' : 'default', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
    }}>
      {!src && initial}
    </button>
  )
}

// Soft notice line with an icon, e.g. "Your responses help us personalize…".
export function Notice({ emoji = '💜', children }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: color.surface, borderRadius: '16px', padding: '12px 14px', boxShadow: shadow.card }}>
      <IconTile emoji={emoji} size={28} />
      <p style={{ ...type.small, color: color.muted, paddingTop: '4px' }}>{children}</p>
    </div>
  )
}

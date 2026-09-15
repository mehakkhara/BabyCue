// Design tokens — the one place the app's colours, radii and type live.
// Screens keep using inline style objects; they just read from here instead
// of repeating hex codes. Inter stays the only typeface.

export const color = {
  primary: '#7C6FF7',
  primaryDeep: '#6d5fe6',
  primarySoft: '#a78bfa',
  lavender: '#c4b5fd',
  tint: '#ede9fe',
  tintLight: '#f5f3ff',
  ink: '#1e1b4b',
  inkSoft: 'rgba(30,27,75,0.7)',
  text: '#3f3d56',
  muted: '#6b7280',
  faint: '#9ca3af',
  hairline: '#ece9f6',
  surface: '#ffffff',
  sheet: '#faf9ff',
  page: '#f7f6fb',
  paper: '#FAF8F4',   // detail pages: warm off-white, no gradient bleed
  success: '#15803d',
  successBg: '#f0fdf4',
  warn: '#9a3412',
  warnBg: '#fff7ed',
  warnBorder: '#fed7aa',
  danger: '#b91c1c',
}

// Tinted tiles behind icons — each row on Today gets its own hue so the four
// rows read as four different things at a glance.
export const tile = {
  lavender: { bg: '#ede9fe', fg: '#7C6FF7' },
  amber:    { bg: '#fef3c7', fg: '#b45309' },
  rose:     { bg: '#ffe4e6', fg: '#e11d48' },
  sky:      { bg: '#e0f2fe', fg: '#0369a1' },
  mint:     { bg: '#dcfce7', fg: '#15803d' },
  peach:    { bg: '#ffedd5', fg: '#c2410c' },
}

export const radius = {
  card: 20,
  cardLg: 24,
  chip: 12,
  pill: 999,
  button: 14,
  tile: 14,
}

export const shadow = {
  card: '0 4px 20px rgba(100,100,180,0.07)',
  cardLg: '0 4px 24px rgba(100,100,180,0.08)',
  button: '0 6px 16px rgba(124,111,247,0.28)',
  sheet: '0 -8px 40px rgba(100,100,180,0.25)',
}

export const gradient = {
  primary: 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
}

export const type = {
  h1: { fontSize: '26px', fontWeight: 700, color: color.ink, lineHeight: 1.2, letterSpacing: '-0.01em', margin: 0 },
  h2: { fontSize: '20px', fontWeight: 700, color: color.ink, lineHeight: 1.25, margin: 0 },
  h3: { fontSize: '16px', fontWeight: 700, color: color.ink, lineHeight: 1.3, margin: 0 },
  body: { fontSize: '14px', fontWeight: 400, color: color.muted, lineHeight: 1.6, margin: 0 },
  bodyStrong: { fontSize: '15px', fontWeight: 600, color: color.ink, lineHeight: 1.4, margin: 0 },
  small: { fontSize: '12px', color: color.faint, lineHeight: 1.5, margin: 0 },
  kicker: { fontSize: '11px', fontWeight: 700, color: '#e0703c', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 },
  label: { fontSize: '11px', fontWeight: 700, color: color.inkSoft, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 },
}

export const space = {
  page: '16px',
  pageTop: '24px',
  navGap: '84px',
}

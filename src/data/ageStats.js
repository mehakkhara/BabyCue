// Typical daily numbers by month — reference only, never something to log.
// Based on American Academy of Pediatrics guidance. Moved from Home so the
// Growth screen can show "typical at this age" without Home carrying it.

export const AGE_STATS = {
  0:  { milk: '16–24 oz', wake: '45–60 min', naps: '4–5', diapers: '8–12' },
  1:  { milk: '16–24 oz', wake: '45–60 min', naps: '4–5', diapers: '8–12' },
  2:  { milk: '24–32 oz', wake: '1–1.5 hr',  naps: '4–5', diapers: '6–8'  },
  3:  { milk: '24–32 oz', wake: '1–1.5 hr',  naps: '3–5', diapers: '6–8'  },
  4:  { milk: '24–36 oz', wake: '1.5–2 hr',  naps: '3–4', diapers: '4–6'  },
  5:  { milk: '24–36 oz', wake: '1.5–2.5 hr',naps: '3',   diapers: '4–6'  },
  6:  { milk: '24–36 oz', wake: '2–3 hr',    naps: '2–3', diapers: '4–6'  },
  7:  { milk: '24–32 oz', wake: '2.5–3 hr',  naps: '2–3', diapers: '4–5'  },
  8:  { milk: '24–32 oz', wake: '2.5–3 hr',  naps: '2',   diapers: '4–5'  },
  9:  { milk: '24–32 oz', wake: '3–3.5 hr',  naps: '2',   diapers: '4–5'  },
  10: { milk: '16–24 oz', wake: '3–4 hr',    naps: '1–2', diapers: '4–5'  },
  11: { milk: '16–24 oz', wake: '3–4 hr',    naps: '1–2', diapers: '4–5'  },
  12: { milk: '16–24 oz', wake: '3.5–4.5 hr',naps: '1–2', diapers: '4–5'  },
  13: { milk: '16–24 oz', wake: '4–5 hr',    naps: '1–2', diapers: '3–5'  },
  14: { milk: '16–24 oz', wake: '4–5 hr',    naps: '1–2', diapers: '3–5'  },
  15: { milk: '16–24 oz', wake: '4.5–5.5 hr',naps: '1–2', diapers: '3–5'  },
  16: { milk: '16–24 oz', wake: '5–6 hr',    naps: '1',   diapers: '3–4'  },
  17: { milk: '16–24 oz', wake: '5–6 hr',    naps: '1',   diapers: '3–4'  },
  18: { milk: '16–24 oz', wake: '5–6 hr',    naps: '1',   diapers: '3–4'  },
  19: { milk: '14–20 oz', wake: '5–6 hr',    naps: '1',   diapers: '3–4'  },
  20: { milk: '14–20 oz', wake: '5.5–6 hr',  naps: '1',   diapers: '3–4'  },
  21: { milk: '14–20 oz', wake: '5.5–6 hr',  naps: '1',   diapers: '3–4'  },
  22: { milk: '14–20 oz', wake: '5.5–6.5 hr',naps: '1',   diapers: '2–4'  },
  23: { milk: '14–20 oz', wake: '6+ hr',     naps: '1',   diapers: '2–4'  },
  24: { milk: '14–20 oz', wake: '6+ hr',     naps: '1',   diapers: '2–4'  },
}

export const AGE_STATS_SOURCE = 'American Academy of Pediatrics'

export function statItemsFor(month) {
  const s = AGE_STATS[Math.max(0, Math.min(24, month))] || AGE_STATS[12]
  return [
    { emoji: '🍼', label: 'Milk/day',    value: s.milk    },
    { emoji: '⏱️', label: 'Wake window', value: s.wake    },
    { emoji: '💤', label: 'Naps',        value: s.naps    },
    { emoji: '🩹', label: 'Diapers',     value: s.diapers },
  ]
}

// Time-of-day awareness — the app has a rhythm instead of one static face.
// Pure functions of the hour so they're trivial to test and to re-check on
// focus/visibility (a phone app is mostly *resumed*, not left open).

// Wind-down window: evening story time through the night feeds.
export function isBedtimeHour(h = new Date().getHours()) {
  return h >= 19 || h < 5
}

export function greetingForHour(h, momName) {
  if (h >= 19 || h < 5) return `Winding down, ${momName} 🌙`
  if (h >= 17) return `Good evening, ${momName} 🌆`
  if (h >= 12) return `Good afternoon, ${momName} ☀️`
  return `Good morning, ${momName} ☀️`
}

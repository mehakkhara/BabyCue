import { getEntries as getJournalEntries } from '../data/journalStore'
import { getPercentile, ordinal, monthsBetween } from '../data/whoStandards'

export function loadLatestGrowth(profile) {
  try {
    const raw = JSON.parse(localStorage.getItem('growthEntries') || '[]')
    if (!raw.length || !profile.dateOfBirth) return null
    const sorted = [...raw].sort((a, b) => new Date(b.date) - new Date(a.date))
    const e = sorted[0]
    const ageMonths = monthsBetween(profile.dateOfBirth, e.date)
    const sex = profile.babySex
    const out = { date: e.date, ageMonths, weight: e.weight, height: e.height }
    if (sex && e.weight != null) {
      out.weightPercentile = ordinal(getPercentile(ageMonths, e.weight / 2.205, sex, 'weight'))
    }
    if (sex && e.height != null) {
      out.heightPercentile = ordinal(getPercentile(ageMonths, e.height, sex, 'height'))
    }
    return out
  } catch {
    return null
  }
}

export async function loadRecentJournalNotes(limit = 5) {
  try {
    const entries = await getJournalEntries()
    return entries
      .filter(e => e.note && e.note.trim().length > 0)
      .slice(0, limit)
      .map(e => ({
        date: new Date(e.createdAt).toISOString().split('T')[0],
        note: e.note.length > 200 ? e.note.slice(0, 200) + '…' : e.note,
      }))
  } catch {
    return []
  }
}

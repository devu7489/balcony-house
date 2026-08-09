// Local calendar date as YYYY-MM-DD - never new Date().toISOString(), which converts to UTC
// first and silently returns "yesterday" for anyone east of UTC (or "tomorrow" for anyone
// west of it) for several hours around their own local midnight.
export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function nextDayIso(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const next = new Date(y, m - 1, d + 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
}

export function tomorrowIso() {
  return nextDayIso(todayIso())
}

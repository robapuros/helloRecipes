/**
 * Parse a HelloFresh time string like "25m", "1h", "1h 30m" into integer minutes.
 * Returns null if the string can't be parsed.
 */
export function parseTimeMinutes(timeStr: string | undefined | null): number | null {
  if (!timeStr) return null
  const str = timeStr.trim()

  // Patterns: "25m", "1h", "1h 30m", "1h30m", "90m"
  const hoursAndMinutes = str.match(/^(?:(\d+)h\s*)?(?:(\d+)m)?$/)
  if (hoursAndMinutes && (hoursAndMinutes[1] || hoursAndMinutes[2])) {
    const hours = parseInt(hoursAndMinutes[1] || '0', 10)
    const minutes = parseInt(hoursAndMinutes[2] || '0', 10)
    return hours * 60 + minutes
  }

  // Plain number (assume minutes)
  const plain = parseInt(str, 10)
  if (!isNaN(plain)) return plain

  return null
}

/**
 * Format minutes into a human-readable Spanish string.
 * e.g. 25 → "25 min", 90 → "1 h 30 min"
 */
export function formatTime(minutes: number | null | undefined): string {
  if (!minutes) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}

/**
 * Return a color class based on cooking time.
 * Green = fast (<= 30 min), amber = medium (31–45), red = long (> 45)
 */
export function timeColor(minutes: number | null | undefined): string {
  if (!minutes) return 'text-muted-foreground'
  if (minutes <= 30) return 'text-green-600'
  if (minutes <= 45) return 'text-amber-600'
  return 'text-red-500'
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts
  return letters.map((part) => part[0]!.toUpperCase()).join('') || '?'
}

export function formatHourlyRate(
  hourlyRate: string | null,
  currency: string | null,
): string | null {
  if (!hourlyRate) return null
  const amount = Number(hourlyRate)
  if (!Number.isFinite(amount)) return null
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency ?? 'EUR',
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount)
  } catch {
    return `${amount} ${currency ?? ''}`.trim()
  }
}

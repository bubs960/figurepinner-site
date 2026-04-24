/**
 * figureFormatters.ts
 * Pure formatting utilities for figure display — no side effects, unit-testable.
 */

/** Strip null/None/undefined variant artifacts from figure names. */
export function cleanFigureName(raw: string): string {
  return raw
    .replace(/\s*\(\s*(none|null|undefined)\s*\)/gi, '')
    .replace(/\s*\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Convert a slug like "john-cena" to "John Cena" */
export function prettifySlug(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Format a number as USD currency, no cents for whole numbers */
export function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`
}

/** Format an ISO date string as "Apr 18" */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

/** Derive confidence level (1–5) from comp count */
export function compCountToConfidence(count: number): 1 | 2 | 3 | 4 | 5 {
  if (count >= 31) return 5
  if (count >= 16) return 4
  if (count >= 6)  return 3
  if (count >= 3)  return 2
  return 1
}

/** Compute 90-day trend as percent change (positive = up, negative = down) */
export function computeTrend(
  history: Array<{ price: number; sold_date: string }>
): number | null {
  if (history.length < 6) return null
  const now = Date.now()
  const day = 86400000
  const recent  = history.filter(h => now - new Date(h.sold_date).getTime() <= 30 * day)
  const older   = history.filter(h => {
    const age = now - new Date(h.sold_date).getTime()
    return age > 30 * day && age <= 90 * day
  })
  if (recent.length < 3 || older.length < 3) return null
  const avgRecent = recent.reduce((s, h) => s + h.price, 0) / recent.length
  const avgOlder  = older.reduce((s, h) => s + h.price, 0) / older.length
  return ((avgRecent - avgOlder) / avgOlder) * 100
}

/** Build an eBay affiliate search URL */
export function buildEbaySearchUrl(
  brand: string, line: string, series: string | null, name: string, campaignId: string
): string {
  const terms = encodeURIComponent(`${brand} ${line}${series ? ` ${series}` : ''} ${name}`.trim())
  return `https://www.ebay.com/sch/i.html?_nkw=${terms}&_sop=15&mkcid=1&mkrid=711-53200-19255-0&campid=${campaignId}&toolid=10001`
}

/** Build SVG polyline path from price history points */
export function buildChartPath(
  points: Array<{ date: string; price: number }>,
  width: number,
  height: number
): { linePath: string; areaPath: string } {
  if (points.length < 2) return { linePath: '', areaPath: '' }

  const sorted = [...points].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const dates  = sorted.map(p => new Date(p.date).getTime())
  const prices = sorted.map(p => p.price)
  const minDate  = dates[0]
  const maxDate  = dates[dates.length - 1]
  const minPrice = Math.min(...prices) * 0.85
  const maxPrice = Math.max(...prices) * 1.15
  const dateRange  = maxDate - minDate || 1
  const priceRange = maxPrice - minPrice || 1

  const coords = sorted.map(p => ({
    x: ((new Date(p.date).getTime() - minDate) / dateRange) * width,
    y: height - ((p.price - minPrice) / priceRange) * height,
  }))

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ')

  const areaPath =
    `M${coords[0].x.toFixed(1)},${height} ` +
    coords.map(c => `L${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ') +
    ` L${coords[coords.length - 1].x.toFixed(1)},${height} Z`

  return { linePath, areaPath }
}

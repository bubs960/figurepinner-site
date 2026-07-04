/**
 * figureFormatters.ts
 * Pure formatting utilities for figure display — no side effects, unit-testable.
 */

/** Strip null/None/undefined variant artifacts from figure names. */
function cleanFigureName(raw: string): string {
  return raw
    .replace(/\s*\(\s*(none|null|undefined)\s*\)/gi, '')
    .replace(/\s*\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Explicit display-name overrides for slugs that title-casing gets wrong:
 * acronyms (LJN, NECA, TMNT, DC), branded casing (McFarlane), punctuation
 * (G.I. Joe, 3.75"), and multi-word promotion brands (AEW, NJPW, WWE/WWF).
 *
 * Keys are the exact lowercase KB slug values (fandom / manufacturer /
 * product_line). Grounded in the live KB distinct-value set (W2, 2026-06-06):
 * 21 fandoms, 22 manufacturers, 125 product lines. Anything not listed falls
 * through to the acronym-aware title-caser below.
 */
const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  // ── fandoms ──
  'dc': 'DC',
  'gi-joe': 'G.I. Joe',
  'tmnt': 'TMNT',
  'scifi': 'Sci-Fi',
  'aliens-predator': 'Aliens / Predator',
  'masters-of-the-universe': 'Masters of the Universe',
  'marvel-comics': 'Marvel',
  'pop-culture': 'Pop Culture',

  // ── manufacturers ──
  'ljn': 'LJN',
  'neca': 'NECA',
  'mafex': 'MAFEX',
  'mcfarlane': 'McFarlane',
  'jakks-pacific': 'Jakks Pacific',
  'toy-biz': 'Toy Biz',
  'boss-fight-studio': 'Boss Fight Studio',
  'four-horsemen': 'Four Horsemen',
  'gentle-giant': 'Gentle Giant',
  'hot-toys': 'Hot Toys',
  'storm-collectibles': 'Storm Collectibles',
  'super7': 'Super7',
  'zombie-sailor': 'Zombie Sailor',

  // ── product lines: acronym / branded promotions ──
  'aew-supreme': 'AEW Supreme',
  'aew-unmatched': 'AEW Unmatched',
  'aew-unrivaled': 'AEW Unrivaled',
  'njpw-ultimates': 'NJPW Ultimates',
  'storm-collectibles-njpw': 'Storm Collectibles NJPW',
  'mwfp-ultimates': 'MWFP Ultimates',
  'wcw-galoob': 'WCW Galoob',
  'wcw-toy-biz': 'WCW Toy Biz',
  'wwe-retro': 'WWE Retro',
  'wwe-superstars': 'WWE Superstars',
  'wwf-hasbro': 'WWF Hasbro',
  'ljn-wwf': 'LJN WWF',
  'ljn-vintage': 'LJN Vintage',
  'g1': 'G1',
  'r3-tech': 'R3 Tech',
  'retro-66': "Retro '66",
  '3-75-retro-collection': '3.75" Retro Collection',
  '3-75-walmart': '3.75" Walmart',
  'hasbro-dnd-cartoon-classics': 'Hasbro D&D Cartoon Classics',
  'hasbro-dnd-golden-archive': 'Hasbro D&D Golden Archive',
  'hasbro-ghostbusters': 'Hasbro Ghostbusters',
  'hasbro-retro-collection': 'Hasbro Retro Collection',
  'kenner-ghostbusters': 'Kenner Ghostbusters',
  'kenner-vintage': 'Kenner Vintage',
  'neca-aliens': 'NECA Aliens',
  'neca-godzilla': 'NECA Godzilla',
  'neca-movies': 'NECA Movies',
  'neca-predator': 'NECA Predator',
  'neca-ultimate': 'NECA Ultimate',
  'neca-video-games': 'NECA Video Games',
  'dc-collectibles-batman-animated': 'DC Collectibles Batman: The Animated Series',
  'mcfarlane-dc-direct-digital': 'McFarlane DC Direct Digital',
  'mcfarlane-dc-page-punchers': 'McFarlane DC Page Punchers',
  'mattel-200x': 'Mattel 200X',
  'super7-reaction': 'Super7 ReAction',
  'super7-ultimates': 'Super7 Ultimates',
  'gentle-giant-diamond-select': 'Gentle Giant / Diamond Select',
  'batman-the-animated-series': 'Batman: The Animated Series',
}

/** Words that should be fully uppercased when they appear as a standalone token. */
const ACRONYM_TOKENS = new Set([
  'wwe', 'wwf', 'wcw', 'aew', 'tna', 'njpw', 'roh', 'dc', 'gi', 'ljn',
  'neca', 'mafex', 'mwfp', 'r3', 'dnd', 'nxt', 'jbl',
])

/**
 * Convert a slug like "john-cena" to "John Cena".
 *
 * Resolution order:
 *  1. exact override (handles acronyms, branded casing, punctuation)
 *  2. acronym-aware title case (uppercases known acronym tokens, title-cases the rest)
 *
 * This keeps raw, mis-cased slugs ("Wwe", "Ljn", "Gi Joe") off the live site —
 * the W2 trust fix.
 */
export function prettifySlug(slug: string): string {
  if (!slug) return ''
  const key = slug.toLowerCase()
  if (DISPLAY_NAME_OVERRIDES[key]) return DISPLAY_NAME_OVERRIDES[key]
  return key
    .split('-')
    .map(w => (ACRONYM_TOKENS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
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

function cleanEbaySearchPart(value: string): string {
  return value
    .replace(/[()]/g, ' ')
    .replace(/[·|:/]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/[#"'`]/g, ' ')
    .replace(/\bclass\b/gi, ' ')
    .replace(/\b(none|null|undefined)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Build broad eBay affiliate search terms that still point at the right figure. */
function buildEbaySearchTerms(
  character: string,
  fandom: string,
  brand: string,
  line: string,
  series: string | null | undefined
): string {
  const seen = new Set<string>()

  return [character, fandom, brand, line, series ?? '']
    .map(cleanEbaySearchPart)
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter(token => {
      const key = token.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .join(' ')
}

// Fallback campid is the live EPN campaign — restored after bceb185 silently
// reverted it to ''. Without it, a build missing .env.production ships campid= blank
// (working-looking eBay links that pay $0). Do NOT remove. See Genta audit 2026-06-06 P1.
// `||` (not `??`) on purpose: an env var set to "" must also fall back — `??`
// would keep the empty string and ship a blank campid. (Affiliate-leak audit 2026-06-13.)
// Single source of truth — every eBay-affiliate-link call site imports this,
// never redeclares it, so the fallback can't drift out of sync again.
export const EBAY_CAMPAIGN_ID = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID || '5339147406'

/** Build an eBay affiliate search URL */
export function buildEbaySearchUrl(
  character: string,
  fandom: string,
  brand: string,
  line: string,
  series: string | null | undefined,
  campaignId: string
): string {
  const terms = encodeURIComponent(buildEbaySearchTerms(character, fandom, brand, line, series))
  return `https://www.ebay.com/sch/i.html?_nkw=${terms}&_sop=15&mkcid=1&mkrid=711-53200-19255-0&campid=${campaignId}&toolid=10001`
}

/** Build SVG polyline path from price history points */
function buildChartPath(
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

/**
 * Plain-English data-quality state derived from the count of recent eBay
 * sold comps. Drives the user-visible badge — keeps users honest about how
 * much trust to place in the price.
 *
 * Thresholds chosen empirically:
 *   reliable: enough comps that the median is statistically meaningful
 *   limited:  enough to direction-check but not to bid against
 *   sparse:   1-3 comps — anchor-point only, treat as anecdote
 *   none:     0 comps — no data at all, surface affiliate search instead
 */
export type DataQualityState = 'reliable' | 'limited' | 'sparse' | 'none'

export function dataQualityState(soldCount: number): DataQualityState {
  if (soldCount >= 10) return 'reliable'
  if (soldCount >= 4)  return 'limited'
  if (soldCount >= 1)  return 'sparse'
  return 'none'
}


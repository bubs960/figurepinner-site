/**
 * figureFormatters.ts
 * Pure formatting utilities for figure display — no side effects, unit-testable.
 */

import { formatShortDate } from '@/lib/safeDate'

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
  // Figures Toy Company -- found rendering as "Ftc" (2026-08-25, webaudit
  // sweep of the small-line-hub content fix; the manufacturer slug is real
  // KB data, this override gap predates and is independent of that fix).
  'ftc',
  // Convention/venue names surfaced by the same fix's new exclusive_to
  // clause (San Diego Comic-Con 38 occurrences, New York Comic Con 7,
  // Major League Baseball crossover figures 4) -- same acronym-casing gap
  // class as ftc above, not previously exercised anywhere on the site.
  'sdcc', 'nycc', 'mlb',
  // KB Toys (the retailer) -- found by webaudit's independent re-verification
  // of 47bd6dd: "KB Toys" is already correctly cased upstream, but
  // titleCaseValue lowercases every token before re-casing, and 'kb' wasn't
  // here, so it rendered as "Kb Toys." Same gap class as ftc/sdcc/nycc/mlb.
  'kb',
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

// eBay did not exist before 1995, so a comp timestamp at or before the Unix
// epoch — or anywhere in the decades before eBay — is upstream null/0 coercion
// rather than a sale. Used as the plausibility floor in formatDate below.
const EARLIEST_PLAUSIBLE_COMP_MS = Date.UTC(1995, 0, 1)

/**
 * Format an ISO date string as "Apr 18", or '' when the input is not a usable
 * date. The only caller renders this straight into a comp row
 * (`MarketPanel.tsx:234`), so a blank cell is the honest output for a comp
 * whose sold_date never arrived.
 *
 * 2026-07-27: the previous body was `try { new Date(iso)... } catch { return iso }`,
 * which FABRICATED dates instead of failing, on a surface whose entire pitch is
 * "real eBay sold prices":
 *   - `new Date(null)` is epoch 0, not an error. It formatted as a real-looking
 *     "Dec 31" (1969, in any negative UTC offset) — observed on 19/19 comps of
 *     one figure, presented as a genuine sold date.
 *   - `new Date(undefined)` / `new Date('')` are Invalid Date, whose
 *     toLocaleDateString returns the literal string "Invalid Date".
 * Neither path throws, so the catch was dead code guarding nothing. The
 * parameter is widened to accept null/undefined because that is what actually
 * arrives at runtime — the old `string` annotation is what hid this.
 * Guard shape ported from the sibling that already got it right:
 * `src/data/indexValueCensus.ts:48`.
 *
 * 2026-08-06 root-cause fix, moved to the shared util 2026-08-06 same day
 * (see src/lib/safeDate.ts for the full incident writeup — every future
 * date-format call in a client component should read that file first): was
 * `toLocaleDateString('en-US', {...})`. Root-caused via bisection with real
 * comp data (never reproduced against the empty local dataset): Cloudflare
 * Workers' V8/ICU build and Chrome's ship different CLDR data for this exact
 * locale/option pair, and at least one of them separates month and day with
 * U+202F (narrow no-break space) where the other uses a plain space —
 * invisible on screen, but a different string. `formatDate` runs inside
 * MarketPanel.tsx, a 'use client' component that re-executes on hydration,
 * so server (Workers) and client (browser) independently called
 * `toLocaleDateString` and got back two byte-different strings for the same
 * date — a textbook React #418 hydration mismatch, firing on every figure
 * page with at least one real dated comp.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const ms = d.getTime()
  if (Number.isNaN(ms) || ms < EARLIEST_PLAUSIBLE_COMP_MS) return ''
  return formatShortDate(d)
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

/**
 * Windowed trend for the /today spotlight (Steve ruling 2026-09-06, standalone
 * relay STANDALONE-TO-WEB-TODAY-SPOTLIGHT-RULING-2026-09-06: relax the recency
 * floor, do not noindex, label honestly). Unlike computeTrend() it does NOT
 * require comps in the last 30 days: it takes every comp inside the last
 * `windowDays`, sorts by sold_date, and compares the newer half against the
 * older half. Needs >= minPerHalf comps in each half or returns null, so thin
 * data still never embarrasses a real figure. Stopgap tied to the sold-comps
 * pipeline being CAPTCHA-walled since ~2026-07-22; tighten back to
 * computeTrend() once 30-day data is reliable again.
 */
export function computeTrendWindowed(
  history: Array<{ price: number; sold_date: string }>,
  opts: { windowDays?: number; minPerHalf?: number; now?: number } = {}
): number | null {
  const windowDays = opts.windowDays ?? 90
  const minPerHalf = opts.minPerHalf ?? 3
  const now = opts.now ?? Date.now()
  const day = 86400000
  const inWindow = history
    .map(h => ({ price: h.price, t: new Date(h.sold_date).getTime() }))
    .filter(h => Number.isFinite(h.t) && h.t <= now && now - h.t <= windowDays * day)
    .sort((a, b) => a.t - b.t)
  if (inWindow.length < minPerHalf * 2) return null
  const mid = Math.floor(inWindow.length / 2)
  const older = inWindow.slice(0, mid)
  const recent = inWindow.slice(mid)
  if (older.length < minPerHalf || recent.length < minPerHalf) return null
  const avgOlder = older.reduce((s, h) => s + h.price, 0) / older.length
  const avgRecent = recent.reduce((s, h) => s + h.price, 0) / recent.length
  if (avgOlder <= 0) return null
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
 *   sparse:   1-2 comps — anchor-point only, treat as anecdote (Release S: was 1-3)
 *   none:     0 comps — no data at all, surface affiliate search instead
 */
export type DataQualityState = 'reliable' | 'limited' | 'sparse' | 'none'

export function dataQualityState(soldCount: number): DataQualityState {
  // Release S (2026-09-07, external audit F9 / webaudit omnibus item 3): the
  // badge's 'limited' band used to start at 4 while priceCompTier's 'thin'
  // starts at MIN_COMPS_TO_QUOTE (3) -- a 3-comp figure was "sparse, anchor
  // point only" on the badge and a quoted thin median in the ledger. One
  // policy now: 10+ reliable/trustworthy, 3-9 limited/thin, 1-2 sparse/suppress.
  if (soldCount >= TRUSTWORTHY_COMPS) return 'reliable'
  if (soldCount >= MIN_COMPS_TO_QUOTE) return 'limited'
  if (soldCount >= 1) return 'sparse'
  return 'none'
}

/**
 * FPPS-01 (2026-07-15, Steve's binding product decision, price-contract fix).
 * Distinct from dataQualityState above -- that drives the badge copy/dot
 * color with its own 4-tier thresholds (10/4/1). This is the strict 3-tier
 * rule for whether a PRICE NUMBER may render at all, and whether it needs a
 * "thin data" caveat, on every price-bearing surface (bottom summary, prose,
 * meta tags, JSON-LD, mobile action bar). Do not conflate the two: a figure
 * can be dataQualityState 'limited' (4-9 comps) while priceCompTier says
 * 'thin' (3-9) or 'suppress' (0-2) for a SPECIFIC condition bucket, since
 * this tier is evaluated per-bucket (sealed vs loose), not on the pooled
 * soldCount dataQualityState uses.
 *
 *   trustworthy: 10+ comps -- show as a normal number, no caveat.
 *   thin:        3-9 comps -- show the number, but the surface must label
 *                it "thin data" (or equivalent) wherever it renders.
 *   suppress:    0-2 comps -- do NOT render a number for this bucket at all.
 *                Surfaces show "insufficient recent comps" (or omit
 *                entirely, on space-constrained surfaces like meta tags).
 */
export type PriceCompTier = 'trustworthy' | 'thin' | 'suppress'

/**
 * THE comp-count floor for quoting a median anywhere on the site (FPPS-01 rule
 * 2: "<3 -> suppress"). Every surface that decides whether a price number
 * renders reads this constant -- priceCompTier, BidCheck's column gate, the
 * hero price block / placard rows (via priceContract.quotableBuckets) and the
 * Decision-Passport bucket cards. 2026-09-02 (webaudit pass-1 defect 1): the
 * hero and the passport block had their own `count >= 1` gates and quoted
 * "$25 median · LOW · 2 comps" on a bucket that Bid Check and Recent Sales, on
 * the same page, correctly refused to quote -- one page, three verdicts.
 */
export const MIN_COMPS_TO_QUOTE = 3
export const TRUSTWORTHY_COMPS = 10

export function priceCompTier(compCount: number): PriceCompTier {
  if (compCount >= TRUSTWORTHY_COMPS) return 'trustworthy'
  if (compCount >= MIN_COMPS_TO_QUOTE) return 'thin'
  return 'suppress'
}


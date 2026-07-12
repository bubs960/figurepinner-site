/**
 * sparklinePath.ts — pure, server-safe SVG path builder for the Liquid Gold
 * Sparkline (P2.2 spec, webaudit 2026-07-08). Computed at ISR/build time so
 * the path `d` bakes into static HTML — zero per-request work, matches the
 * same ISR-safety discipline as the rest of the figure page's price data.
 *
 * Sparse-data pre-check (2026-07-11, WEB-TO-WEBAUDIT-SPARKLINE-SPARSE-DATA-
 * PRECHECK-2026-07-11.md): 86.4% of priced figures have >=4 qualifying sold
 * points and get the full treatment; 13.6% get the fallback below.
 */

export interface SparklinePoint {
  price: number
  sold_date: string
}

export interface SparklinePathResult {
  /** SVG path `d` attribute, coordinates in the SPARKLINE_VIEW_BOX space. */
  d: string
  /** Real distinct sold-comp count feeding the line (never the rendering-only duplicate for a single point). */
  pointCount: number
  /** >=4 real points — Session 2 mounts the full liquid treatment; below this, static gradient only. */
  fullTreatment: boolean
  /** Most recent (rightmost) point's price — Session 2's momentum droplet anchors here. */
  latestPrice: number
  /** Y coordinate (SPARKLINE_VIEW_BOX space) of the final rendered point. X is always SPARKLINE_END_X. */
  endY: number
}

const VIEW_W = 600
const VIEW_H = 60
const PAD_Y = 6

// Same date-validity bar as FigureDetailContent's latestSoldDate() — a
// pre-2000 or unparseable sold_date must never corrupt point ordering.
const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/
const MIN_VALID_SOLD_MS = Date.UTC(2000, 0, 1)

/**
 * Builds the price-over-time path from real sold comps, oldest to newest.
 * Returns null when there is nothing honest to draw (0 valid points) — the
 * caller must fall through to the existing "no pricing data" state, never
 * render a fabricated line (P2.2 spec, sparse-data fallback rule #3).
 */
export function buildSparklinePath(history: SparklinePoint[]): SparklinePathResult | null {
  const clean = history
    .filter((h) => typeof h.price === 'number' && h.price > 0 && ISO_DATE_PREFIX.test(h.sold_date ?? ''))
    .map((h) => ({ price: h.price, t: new Date(h.sold_date).getTime() }))
    .filter((h) => !Number.isNaN(h.t) && h.t >= MIN_VALID_SOLD_MS)
    .sort((a, b) => a.t - b.t)

  if (clean.length === 0) return null

  // A single real point can't form a line -- render it as an honest flat
  // stroke (both ends the same known price) rather than a single dot lost
  // in a 600x60 box. pointCount below still reports the true count (1), not
  // this rendering-only duplication.
  const prices = clean.length === 1 ? [clean[0].price, clean[0].price] : clean.map((c) => c.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min
  // range===0 covers both the single-point duplication above AND the rarer
  // case of multiple real sales that all landed at the identical price --
  // (p-min)/range would divide by zero, and falling back to a nonzero range
  // would silently pin every point's y to the SAME end of the box (looks
  // like the line collapsed to the bottom edge, not "flat and centered").
  const centerY = PAD_Y + (VIEW_H - PAD_Y * 2) / 2

  let endY = centerY
  const d = prices
    .map((p, i) => {
      const x = prices.length === 1 ? 0 : (i / (prices.length - 1)) * VIEW_W
      const y = range === 0 ? centerY : PAD_Y + (1 - (p - min) / range) * (VIEW_H - PAD_Y * 2)
      if (i === prices.length - 1) endY = y
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return {
    d,
    pointCount: clean.length,
    fullTreatment: clean.length >= 4,
    latestPrice: clean[clean.length - 1].price,
    endY,
  }
}

export const SPARKLINE_VIEW_BOX = `0 0 ${VIEW_W} ${VIEW_H}`
export const SPARKLINE_END_X = VIEW_W

/**
 * Pure helpers for the price-check route, split out because a Next.js route
 * file may only export the reserved handler names (GET/POST/etc.) plus a
 * short config allowlist -- everything else fails the route module's type
 * contract. See ../route.ts for the endpoint itself.
 */
import { pickPrimaryQuote } from '@/app/figure/[figure_id]/_lib/priceContract'

/** Re-exported so existing imports of `primaryQuote` from this module keep
 *  working; the actual logic now lives in priceContract.ts (shared with
 *  LiveMedian) so the two surfaces can't drift on primary-condition order. */
export const primaryQuote = pickPrimaryQuote

/** Full-precision spoken currency — no "k" abbreviation, Siri reads "$1,250" fine. */
export function spokenCurrency(n: number): string {
  const hasCents = Math.round(n * 100) % 100 !== 0
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  })}`
}

export function spokenLine(name: string, brand: string, line: string, q: ReturnType<typeof primaryQuote>): string {
  const who = `${name}, ${brand}`
  if (!q) return `${who}: no sold sales on record yet.`
  if (q.evidenceTier === 'thin' && q.lastSoldPrice != null && q.lastSoldDate) {
    return `${who}: last sold ${q.lastSoldDate} for ${spokenCurrency(q.lastSoldPrice)}, not enough recent sales for a median.`
  }
  if (q.median == null) return `${who}: no sold sales on record yet.`
  const priceLine = `${who} ${line}: median ${spokenCurrency(q.median)} from ${q.count ?? 0} sold`
  if (q.evidenceTier === 'recent') return `${priceLine}, based on sales over the last 6 months.`
  if (q.evidenceTier === 'historical' && q.lastSoldDate) return `${priceLine}, last sold ${q.lastSoldDate}, older evidence.`
  return `${priceLine}.`
}

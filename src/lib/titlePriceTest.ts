// PRICE-IN-TITLE TEST (Steve go, 2026-09-18). One fandom, pre-registered.
//
// Why: Bing query data (API read 2026-09-18, 141 d): queries that contain a
// price word ("price", "value", "worth") click through at 23.4%; name-only
// queries ("kane elite 63") at 10.6% — and name-only is the biggest bucket
// (745 queries / 1,580 impressions). Figure titles say "Price & Value" but never
// show a number. Hypothesis: the number in the SERP title lifts name-only CTR.
//
// Treatment: figure pages in PRICE_IN_TITLE_FANDOMS, only when the price is
// TRUSTWORTHY-tier (>= 10 sold comps) — a title has no room for a thin-data
// label, so thin/suppressed prices never reach it.
// Control: every other fandom's figure pages (same title-fit ladder, no number).
// Baseline (Bing GetPageStats, 141 d to 2026-09-11): wrestling 57 clicks / 731
// impr = 7.8% CTR, avg pos 5.3; all other fandoms pooled 102 / 1,273 = 8.0%.
// Readout: 28 d after ship, again at 56 d. Roll out if wrestling CTR beats
// control by >= 3 points with >= 300 wrestling impressions and position no
// worse than +1.0; roll back if it trails by >= 3 points or position slips
// > 1.5. Low volume — a directional read, stated as such.
// Full pre-registration: Bridge/WEB-PRICE-IN-TITLE-TEST-PREREG-2026-09-18.md
//
// ROLLBACK = empty this set. Nothing else reads it.
import type { PriceContract } from '@/app/figure/[figure_id]/_lib/priceContract'
import { formatGroupedNumber } from '@/lib/safeNumber'

export const PRICE_IN_TITLE_FANDOMS: ReadonlySet<string> = new Set(['wrestling'])

export function priceInTitleEnabled(fandomSlug: string | null | undefined): boolean {
  return fandomSlug != null && PRICE_IN_TITLE_FANDOMS.has(fandomSlug)
}

// ICU-free formatter (CLAUDE.md truth #8) — server-only here, but one house rule.
const usd = (n: number) => '$' + formatGroupedNumber(Math.round(n))

/**
 * The number(s) a title may carry, or null when no honest one exists.
 * Rules inherited from the price contract (Steve's standing decisions):
 *  - both conditions present -> BOTH are named or NEITHER is; never one picked
 *    to stand in for "the" price. If either is below trustworthy, no number.
 *  - a pooled number is used only when it is a true median (never an average).
 */
export function titlePriceFragment(contract: PriceContract): string | null {
  if (contract.hasNoData) return null
  const ok = (c: { median: number | null; tier: string } | null | undefined): c is { median: number; tier: string } =>
    c != null && c.median != null && c.tier === 'trustworthy'
  if (contract.hasBothConditions) {
    return ok(contract.sealed) && ok(contract.loose)
      ? `${usd(contract.sealed.median)} Sealed / ${usd(contract.loose.median)} Loose`
      : null
  }
  if (ok(contract.sealed)) return `${usd(contract.sealed.median)} Sealed`
  if (ok(contract.loose)) return `${usd(contract.loose.median)} Loose`
  if (contract.pooled && !contract.pooled.isAvg && ok(contract.pooled)) return `${usd(contract.pooled.median)} Median`
  return null
}

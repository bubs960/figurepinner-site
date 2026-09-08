// Pure Phase 1b helpers for PriceBlock.tsx, split out because this repo's
// test loader can't import a .tsx file directly (no other test does either
// -- same reasoning as guides/_lib/liveMedianView.ts).
import type { ConditionPrice } from './priceContract'

export function usable(b: ConditionPrice | null): b is ConditionPrice {
  return b != null && b.median != null && b.count >= 1
}

/** Ruling STEVE-RULING-QUOTE-TIERS-90-180-270-2026-09-07.md: 1-2 validated
 *  dated sales in 270 d shows the last-sold price, never a median. Returns
 *  the {date, price} pair (not a type-guarded ConditionPrice) to sidestep a
 *  TS control-flow narrowing quirk across sequential if/else-if checks. */
export function thinEvidence(b: ConditionPrice | null): { date: string; price: number } | null {
  if (b == null || b.evidenceTier !== 'thin' || b.lastSoldPrice == null || b.lastSoldDate == null) return null
  return { date: b.lastSoldDate, price: b.lastSoldPrice }
}

/** Caption text for the tier backing this bucket's number -- verbatim label
 *  from the API where one exists (fresh carries none). Plain string (not
 *  JSX) so it's usable from both PriceBlock.tsx and plain tests. */
export function tierCaption(b: ConditionPrice): string {
  if (b.evidenceTier === 'recent') return 'median, based on sales over the last 6 months'
  if (b.evidenceTier === 'historical' && b.evidenceLabel) return `median · ${b.evidenceLabel}, older evidence`
  return 'median, last 90 days'
}

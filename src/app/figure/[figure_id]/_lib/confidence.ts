// confidence.ts — the ONE home for comp-count confidence thresholds.
// v4 build plan (WEB-FIGURE-PAGE-V4-BUILD-PLAN-2026-08-13 §1): the price
// block's chips and the Decision Passport's bucket cards must share these
// thresholds — extracted here so they can never fork. Consumers map `tier`
// to their own palette (the passport's --dp-* vars don't resolve outside
// its card, so this helper deliberately returns no colors).

export type ConfidenceTier = 'high' | 'medium' | 'low'

export interface ConfidenceInfo {
  tier: ConfidenceTier
  /** Passport-card wording ("HIGH CONFIDENCE" / "MEDIUM — n<8" / "LOW — thin bucket"). */
  passportLabel: string
  /** Price-block chip wording ("HIGH · 11 comps" style, count included). */
  chipLabel: string
}

/** HIGH ≥8 comps / MEDIUM 4–7 / LOW <4 — the doc's own thresholds. */
export function confidenceForCount(count: number): ConfidenceInfo {
  if (count >= 8) {
    return { tier: 'high', passportLabel: 'HIGH CONFIDENCE', chipLabel: `HIGH · ${count} comps` }
  }
  if (count >= 4) {
    return { tier: 'medium', passportLabel: 'MEDIUM — n<8', chipLabel: `MEDIUM · ${count} comps` }
  }
  return { tier: 'low', passportLabel: 'LOW — thin bucket', chipLabel: `LOW · ${count} comp${count === 1 ? '' : 's'}` }
}

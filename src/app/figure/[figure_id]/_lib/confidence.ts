// confidence.ts — the ONE home for comp-count confidence thresholds.
// v4 build plan (WEB-FIGURE-PAGE-V4-BUILD-PLAN-2026-08-13 §1): the price
// block's chips and the Decision Passport's bucket cards must share these
// thresholds — extracted here so they can never fork. Consumers map `tier`
// to their own palette (the passport's --dp-* vars don't resolve outside
// its card, so this helper deliberately returns no colors).
//
// Release S (2026-09-07, external audit F2/F9 = webaudit omnibus item 3):
// this file carried its own 8/4 bands ("MEDIUM — n<8") while the ledger and
// Bid Check on the same page used FPPS-01's 10/3 (thin 3-9). A 7-comp sealed
// bucket read "MEDIUM — n<8" on the passport and "Thin data" in the ledger --
// two vocabularies for one number. The tiers now derive from the FPPS-01
// constants: HIGH = trustworthy (>= 10), MEDIUM = thin (3-9), LOW = suppress
// (< 3, no median quoted anywhere).

import { MIN_COMPS_TO_QUOTE, TRUSTWORTHY_COMPS } from './figureFormatters'

export type ConfidenceTier = 'high' | 'medium' | 'low'

export interface ConfidenceInfo {
  tier: ConfidenceTier
  /** Passport-card wording; every label states its basis (comp count), never a bare "high confidence" (audit F2). */
  passportLabel: string
  /** Price-block chip wording ("HIGH · 11 comps" style, count included). */
  chipLabel: string
}

/** HIGH >= TRUSTWORTHY_COMPS (10) / MEDIUM >= MIN_COMPS_TO_QUOTE (3) / LOW below -- FPPS-01's own bands. */
export function confidenceForCount(count: number): ConfidenceInfo {
  if (count >= TRUSTWORTHY_COMPS) {
    return { tier: 'high', passportLabel: `HIGH — ${count} comps`, chipLabel: `HIGH · ${count} comps` }
  }
  if (count >= MIN_COMPS_TO_QUOTE) {
    return { tier: 'medium', passportLabel: `MEDIUM — thin, n<${TRUSTWORTHY_COMPS}`, chipLabel: `MEDIUM · ${count} comps` }
  }
  return { tier: 'low', passportLabel: `LOW — under ${MIN_COMPS_TO_QUOTE}, no median`, chipLabel: `LOW · ${count} comp${count === 1 ? '' : 's'}` }
}

// Pure render-state derivation for LiveMedian.tsx, split out so it's
// testable without JSX/a component-test harness (this repo has neither --
// same reasoning priceSnaps.ts already documents for its own split).
import type { PriceSnap } from './priceSnaps'
import { deriveTieredPriceContract, pickPrimaryQuote } from '@/app/figure/[figure_id]/_lib/priceContract'
import { formatShortDate } from '@/lib/safeDate'

export type LiveMedianView =
  | { hasData: true; isThin: false; median: number; count: number; evidenceCaveat: string | null }
  | { hasData: false; isThin: true; lastSoldDate: string; lastSoldPrice: number }
  | { hasData: false; isThin: false }

export function deriveLiveMedianView(snap: PriceSnap | null | undefined): LiveMedianView {
  const quote = pickPrimaryQuote(deriveTieredPriceContract(snap?.decision))

  if (quote?.evidenceTier === 'thin' && quote.lastSoldPrice != null && quote.lastSoldDate != null) {
    return { hasData: false, isThin: true, lastSoldDate: quote.lastSoldDate, lastSoldPrice: quote.lastSoldPrice }
  }

  if (quote && quote.median != null && (quote.count ?? 0) > 0) {
    const evidenceCaveat =
      quote.evidenceTier === 'recent' ? 'based on last 6 months'
      : quote.evidenceTier === 'historical' && quote.lastSoldDate ? `last sold ${formatShortDate(new Date(quote.lastSoldDate))}`
      : null
    return { hasData: true, isThin: false, median: quote.median, count: quote.count ?? 0, evidenceCaveat }
  }

  return { hasData: false, isThin: false }
}

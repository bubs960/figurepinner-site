// Pure render-state derivation for LiveMedian.tsx, split out so it's
// testable without JSX/a component-test harness (this repo has neither --
// same reasoning priceSnaps.ts already documents for its own split).
import type { PriceSnap } from './priceSnaps'
import { resolvePriceContract, pickPrimaryQuote } from '@/app/figure/[figure_id]/_lib/priceContract'
import { formatShortDate } from '@/lib/safeDate'

export type LiveMedianView =
  | { hasData: true; isThin: false; median: number; count: number; evidenceCaveat: string | null }
  | { hasData: false; isThin: true; lastSoldDate: string; lastSoldPrice: number }
  | { hasData: false; isThin: false }

export function deriveLiveMedianView(snap: PriceSnap | null | undefined): LiveMedianView {
  // pre-mortem item 1 (2026-09-08): resolvePriceContract falls back to the
  // legacy median_sold/avg_sold/sold_count for a snapshot matcher hasn't
  // regenerated yet, instead of this guide comp card going blank for the
  // whole catalog until migration completes.
  const contract = resolvePriceContract({
    soldCount: snap?.sold_count ?? 0,
    medianSold: snap?.median_sold,
    avgSold: snap?.avg_sold,
    decision: snap?.decision,
  })
  const quote = pickPrimaryQuote(contract)

  if (quote?.evidenceTier === 'thin' && quote.lastSoldPrice != null && quote.lastSoldDate != null) {
    return { hasData: false, isThin: true, lastSoldDate: quote.lastSoldDate, lastSoldPrice: quote.lastSoldPrice }
  }

  const count = quote?.count ?? snap?.sold_count ?? 0
  if (quote && quote.median != null && count > 0) {
    const evidenceCaveat =
      quote.evidenceTier === 'recent' ? 'based on last 6 months'
      : quote.evidenceTier === 'historical' && quote.lastSoldDate ? `last sold ${formatShortDate(new Date(quote.lastSoldDate))}`
      : null
    return { hasData: true, isThin: false, median: quote.median, count, evidenceCaveat }
  }

  return { hasData: false, isThin: false }
}

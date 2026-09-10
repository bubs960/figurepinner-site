// Pure helper for the sparklines route's "latest comp" quote, split out so
// it's testable without an HTTP/Cloudflare-bindings harness -- same reason
// price-check's helpers live in their own _lib module.
import { resolvePriceContract, pickPrimaryQuote } from '@/app/figure/[figure_id]/_lib/priceContract'
import type { DecisionBucket } from '@/lib/priceDecision'

export type SparklineQuote = {
  median: number | null
  soldCount: number
  tier: 'fresh' | 'recent' | 'historical' | 'thin' | 'none'
  lastSoldDate: string | null
  lastSoldPrice: number | null
  /** Cache lifetime ceiling (section 3.4) -- not returned to the client;
   *  the route uses it to bound the batch's shared Cache-Control header. */
  cacheUntil: string | null
}

/**
 * `price` carries both the legacy raw fields and the optional Phase 1b
 * `decision` block; resolvePriceContract (pre-mortem item 1, 2026-09-08)
 * falls back to the legacy median/soldCount for any snapshot matcher's
 * rolling regeneration hasn't reached yet, instead of a silent median:null
 * for the whole catalog until migration completes.
 */
export function deriveSparklineQuote(price: {
  median_sold?: number | null
  avg_sold?: number | null
  sold_count?: number
  decision?: {
    sold_sealed?: DecisionBucket
    sold_loose?: DecisionBucket
    sold_pooled?: DecisionBucket
  }
} | undefined): SparklineQuote {
  const contract = resolvePriceContract({
    soldCount: price?.sold_count ?? 0,
    medianSold: price?.median_sold,
    avgSold: price?.avg_sold,
    decision: price?.decision,
  })
  const quote = pickPrimaryQuote(contract)
  return {
    median: quote?.evidenceTier === 'thin' ? null : (quote?.median ?? null),
    soldCount: quote?.count ?? price?.sold_count ?? 0,
    tier: quote?.evidenceTier ?? 'none',
    lastSoldDate: quote?.lastSoldDate ?? null,
    lastSoldPrice: quote?.lastSoldPrice ?? null,
    cacheUntil: quote?.cacheUntil ?? null,
  }
}

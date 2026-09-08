// Pure helper for the sparklines route's "latest comp" quote, split out so
// it's testable without an HTTP/Cloudflare-bindings harness -- same reason
// price-check's helpers live in their own _lib module.
import { deriveTieredPriceContract, pickPrimaryQuote } from '@/app/figure/[figure_id]/_lib/priceContract'
import type { DecisionBucket } from '@/lib/priceDecision'

export type SparklineQuote = {
  median: number | null
  soldCount: number
  tier: 'fresh' | 'recent' | 'historical' | 'thin' | 'none'
  lastSoldDate: string | null
  lastSoldPrice: number | null
}

export function deriveSparklineQuote(decision: {
  sold_sealed?: DecisionBucket
  sold_loose?: DecisionBucket
  sold_pooled?: DecisionBucket
} | undefined): SparklineQuote {
  const quote = pickPrimaryQuote(deriveTieredPriceContract(decision))
  return {
    median: quote?.evidenceTier === 'thin' ? null : (quote?.median ?? null),
    soldCount: quote?.count ?? 0,
    tier: quote?.evidenceTier ?? 'none',
    lastSoldDate: quote?.lastSoldDate ?? null,
    lastSoldPrice: quote?.lastSoldPrice ?? null,
  }
}

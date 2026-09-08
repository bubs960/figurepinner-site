import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'
import { readPriceObject } from '@/lib/priceStore'
import type { DecisionBucket } from '@/lib/priceDecision'
import { deriveSparklineQuote } from './_lib/sparklineQuote'

export const revalidate = 300

// No auth on this route (public batch price lookup) — same per-IP guard as
// the sibling /api/v1/search endpoint.
//
// Data Defense Layer 2 (2026-07-18): tightened 60->30/min. This is the
// highest bulk-extraction-throughput single endpoint in the app — up to 40
// ids/call (capped above), so 60/min gave a theoretical ceiling of 2,400
// fids/min (the whole 22,790-fid catalog in <10 min at the rate ceiling).
// The 40-id batch cap is untouched (traced every real call site --
// SearchInterface.tsx/HeroSearch.tsx/QuickLookAnchor.tsx -- the search-
// results page legitimately requests up to 40 at once; a real user never
// calls this 30+ times in one minute, so 30/min costs real usage nothing
// while roughly halving the worst-case scrape throughput).
const RATE_LIMIT_PER_MINUTE = 30

export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(req, 'sparklines', RATE_LIMIT_PER_MINUTE)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'rate_limited' },
      // no-store added 2026-07-27: this was the last 429 in the codebase with
      // no Cache-Control. The limiter keys on IP, so any cacheable 429 risks
      // being replayed to a visitor who is not rate limited. Same class as the
      // two `public, max-age=300` 429s already fixed elsewhere; a class test
      // (tests/rateLimit429NoStore.test.mjs) now fails the build on a repeat.
      { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean).slice(0, 40) ?? []
  if (!ids.length) return NextResponse.json({})

  // `stat` says which aggregate `median` actually holds. Phase 1b section 2b
  // (PHASE1B-PUBLICATION-DECISION-CONTRACT-2026-09-07.md): the "latest comp"
  // median now comes from the tiered decision, same as price-check/
  // LiveMedian -- `tier` tells the client which evidence window backed it,
  // and `median` is null (never a re-derived legacy number) on thin/none.
  // NOT WIRED to a live decision block as of 2026-09-07 (matcher's API is
  // staged, not deployed) -- every live snapshot lacks `decision`, so this
  // renders tier:'none'/median:null for everything until the coordinated
  // release. Held on branch release-v-quote-tier-wiring, not merged.
  const results: Record<string, {
    points: number[]
    trend: 'up' | 'down' | 'flat'
    median: number | null
    soldCount: number
    stat: 'median'
    tier: 'fresh' | 'recent' | 'historical' | 'thin' | 'none'
    lastSoldDate: string | null
    lastSoldPrice: number | null
  }> = {}

  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        // Release L (2026-09-03): R2 binding read (up to 40 per call) instead
        // of 40 r2proxy Worker hops. The 3 s AbortSignal the proxy fetch
        // carried is unnecessary on a binding read; the route's own 5-min
        // edge cache is unchanged.
        const snap = await readPriceObject<{
          recent?: Array<{ price: number }>
          decision?: {
            sold_sealed?: DecisionBucket
            sold_loose?: DecisionBucket
            sold_pooled?: DecisionBucket
          }
        }>('price-summaries', id, 300)
        if (!snap) return
        const prices = (snap.recent ?? []).map((r) => r.price).filter((p) => p > 0)
        const quote = deriveSparklineQuote(snap.decision)
        // trend needs at least 2 points; median can stand alone
        if (prices.length < 2 && quote.median == null) return
        const first = prices.slice(0, Math.ceil(prices.length / 2))
        const last  = prices.slice(-Math.ceil(prices.length / 2))
        const avgFirst = first.length ? first.reduce((a, b) => a + b, 0) / first.length : 0
        const avgLast  = last.length  ? last.reduce((a, b) => a + b, 0)  / last.length  : 0
        const trend: 'up' | 'down' | 'flat' =
          prices.length < 2  ? 'flat' :
          avgLast > avgFirst * 1.05 ? 'up' :
          avgLast < avgFirst * 0.95 ? 'down' : 'flat'
        results[id] = { points: prices, trend, stat: 'median', ...quote }
      } catch {
        // skip missing snapshots
      }
    })
  )

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  })
}

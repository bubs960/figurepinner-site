import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

const R2_PROXY = 'https://figurepinner-r2proxy.bubs960.workers.dev'

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

  // `stat` says which aggregate `median` actually holds: snapshots missing
  // median_sold fall back to avg_sold, and labeling an average "median" is
  // the FTC label-truthfulness drift the 5/22 estimated-price spec exists to
  // prevent (S55 audit). Clients render the label from this field.
  const results: Record<string, { points: number[]; trend: 'up' | 'down' | 'flat'; median: number | null; soldCount: number; stat: 'median' | 'avg' }> = {}

  await Promise.allSettled(
    ids.map(async (id) => {
      try {
        const res = await fetch(`${R2_PROXY}/price-summaries/${encodeURIComponent(id)}.json`, {
          signal: AbortSignal.timeout(3000),
        })
        if (!res.ok) return
        const snap = await res.json() as {
          recent?: Array<{ price: number }>
          median_sold?: number | null
          avg_sold?: number | null
          sold_count?: number
        }
        const prices = (snap.recent ?? []).map((r) => r.price).filter((p) => p > 0)
        const median = snap.median_sold ?? snap.avg_sold ?? null
        const stat: 'median' | 'avg' = snap.median_sold != null ? 'median' : 'avg'
        // trend needs at least 2 points; median can stand alone
        if (prices.length < 2 && median == null) return
        const first = prices.slice(0, Math.ceil(prices.length / 2))
        const last  = prices.slice(-Math.ceil(prices.length / 2))
        const avgFirst = first.length ? first.reduce((a, b) => a + b, 0) / first.length : 0
        const avgLast  = last.length  ? last.reduce((a, b) => a + b, 0)  / last.length  : 0
        const trend: 'up' | 'down' | 'flat' =
          prices.length < 2  ? 'flat' :
          avgLast > avgFirst * 1.05 ? 'up' :
          avgLast < avgFirst * 0.95 ? 'down' : 'flat'
        results[id] = { points: prices, trend, median, soldCount: snap.sold_count ?? 0, stat }
      } catch {
        // skip missing snapshots
      }
    })
  )

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  })
}

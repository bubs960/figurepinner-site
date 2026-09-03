import { NextRequest, NextResponse } from 'next/server'
import { deriveName } from '@/data/kbHelpers'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import { searchKb } from '../_lib/kbSearch'
import { checkRateLimit } from '@/lib/rateLimit'
import { readPriceObject } from '@/lib/priceStore'

/**
 * GET /api/v1/price-check?q=<free text>
 *
 * Voice-first price lookup (EBAY-APP-TO-WEB-PRICE-ENDPOINT-2026-06-10).
 * Built for the Siri Shortcut flow: "price check hulk hogan hasbro" while
 * Whatnot stays in the foreground. Also a building block for the lister's
 * Worker migration and the parked Whatnot show-prep build.
 *
 *   200 { match: { fid, name, brand, line }, median_price, sample_size, spoken }
 *   404 { error: "no match" }
 *
 * - Match = top-1 from the same forgiveness ladder as site search
 *   (../_lib/kbSearch.ts — shared on purpose, do not fork the scoring).
 * - Price = r2proxy price-summaries snapshot, median_sold ?? avg_sold —
 *   the same precedence ValueStrip uses.
 * - `spoken` is plain text for Siri TTS. "$24.50" is read natively as
 *   "twenty-four dollars and fifty cents" — do not spell out numbers.
 * - Matched figure with no sold comps returns 200 with median_price null and
 *   an honest spoken line (never a derived price) — S16 honest-blanks rule.
 * - No auth: returns the same public comp data the site already shows.
 *   Abuse posture = edge cache below + Bot Fight Mode (NO custom WAF rules).
 */

// 10 min shared cache per distinct q, 1h SWR — voice queries repeat heavily
// during a show ("hulk hogan" asked 5x = 1 origin hit).
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
}

// Dictation often includes the trigger phrase; strip it so "price check hulk
// hogan" and "hulk hogan" hit the same cache key shape and the same match.
const FILLER = /^(price\s*check|check\s*price|price)\s+/i

type R2Snapshot = {
  median_sold: number | null
  avg_sold: number | null
  sold_count: number
}

/** Full-precision spoken currency — no "k" abbreviation, Siri reads "$1,250" fine. */
function spokenCurrency(n: number): string {
  const hasCents = Math.round(n * 100) % 100 !== 0
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  })}`
}

// S1 (hygiene plan, 2026-07-02): one of two open data faucets (the other is
// r2proxy, a separate worker — week 2). No auth by design (see file header),
// so a fixed-window per-IP limiter is the only abuse guard. Verified bots
// (Googlebot etc.) are exempt inside checkRateLimit — never throttle the
// crawl we're trying to grow post-403-fix.
const RATE_LIMIT_PER_MINUTE = 30

export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(req, 'price-check', RATE_LIMIT_PER_MINUTE)
  if (rl.limited) {
    // no-store, NOT CACHE_HEADERS — see the identical note in the sibling
    // v1/figure route. A per-IP, one-minute throttle must never be cached
    // publicly for 5-10 minutes.
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const raw = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const q = raw.replace(FILLER, '').trim()

  if (q.length < 2) {
    return NextResponse.json({ error: 'no match' }, { status: 404, headers: CACHE_HEADERS })
  }

  try {
    const { scored } = searchKb(q)
    const top = scored[0]
    if (!top) {
      return NextResponse.json({ error: 'no match' }, { status: 404, headers: CACHE_HEADERS })
    }

    const f = top.f
    const name = deriveName(f)
    const brand = prettifySlug(f.manufacturer)
    const line = prettifySlug(f.product_line)
    const match = { fid: f.figure_id, name, brand, line }

    // Release L (2026-09-03): R2 binding read instead of the r2proxy hop.
    const snap = await readPriceObject<R2Snapshot>('price-summaries', f.figure_id, 3600)
    const median = snap ? (snap.median_sold ?? snap.avg_sold) : null
    const soldCount = snap?.sold_count ?? 0

    if (median === null || soldCount === 0) {
      return NextResponse.json(
        {
          match,
          median_price: null,
          sample_size: 0,
          spoken: `${name}, ${brand}: no sold sales on record yet.`,
        },
        { headers: CACHE_HEADERS },
      )
    }

    const medianRounded = Math.round(median * 100) / 100
    return NextResponse.json(
      {
        match,
        median_price: medianRounded,
        sample_size: soldCount,
        spoken: `${name}, ${brand} ${line}: median ${spokenCurrency(medianRounded)} from ${soldCount} sold.`,
      },
      { headers: CACHE_HEADERS },
    )
  } catch {
    return NextResponse.json({ error: 'no match' }, { status: 404, headers: CACHE_HEADERS })
  }
}

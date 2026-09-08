import { NextRequest, NextResponse } from 'next/server'
import { deriveName } from '@/data/kbHelpers'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import { searchKb } from '../_lib/kbSearch'
import { checkRateLimit } from '@/lib/rateLimit'
import { readPriceObject } from '@/lib/priceStore'
import { deriveTieredPriceContract } from '@/app/figure/[figure_id]/_lib/priceContract'
import type { DecisionBucket } from '@/lib/priceDecision'
import { primaryQuote, spokenLine, cacheControlFor } from './_lib/priceCheckSpoken'

/**
 * GET /api/v1/price-check?q=<free text>
 *
 * Voice-first price lookup (EBAY-APP-TO-WEB-PRICE-ENDPOINT-2026-06-10).
 * Built for the Siri Shortcut flow: "price check hulk hogan hasbro" while
 * Whatnot stays in the foreground. Also a building block for the lister's
 * Worker migration and the parked Whatnot show-prep build.
 *
 *   200 { match: { fid, name, brand, line }, median_price, sample_size, tier,
 *         last_sold_date, last_sold_price, spoken }
 *   404 { error: "no match" }
 *
 * - Match = top-1 from the same forgiveness ladder as site search
 *   (../_lib/kbSearch.ts — shared on purpose, do not fork the scoring).
 * - Price = Phase 1b tiered decision (PHASE1B-PUBLICATION-DECISION-CONTRACT-
 *   2026-09-07.md section 2b) via deriveTieredPriceContract, sealed preferred
 *   over loose over pooled (same primary-condition precedence the hero uses).
 *   `tier` is 'fresh'|'recent'|'historical'|'thin'|'none'|null (null = no
 *   snapshot at all). `median_price` is populated for fresh/recent/historical
 *   only; `thin` returns null median with last_sold_date/last_sold_price
 *   instead, per the ruling (never a median from 1-2 sales).
 * - NOT WIRED to a live decision block as of 2026-09-07 (matcher's API side
 *   is staged, not deployed) — every live snapshot today is pre-1b, so this
 *   renders tier:'none' for everything until the coordinated release. Held
 *   on branch `release-v-quote-tier-wiring`, not merged (see
 *   MATCHER-TO-WEB-QUOTE-TIER-SEQUENCING-ANSWER-2026-09-07.md).
 * - `spoken` is plain text for Siri TTS. "$24.50" is read natively as
 *   "twenty-four dollars and fifty cents" — do not spell out numbers.
 * - Matched figure with no publishable evidence returns 200 with
 *   median_price null and an honest spoken line (never a derived price) —
 *   S16 honest-blanks rule.
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
  decision?: {
    sold_sealed?: DecisionBucket
    sold_loose?: DecisionBucket
    sold_pooled?: DecisionBucket
  }
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
    const contract = deriveTieredPriceContract(snap?.decision)
    const quote = primaryQuote(contract)

    return NextResponse.json(
      {
        match,
        median_price: quote?.median != null ? Math.round(quote.median * 100) / 100 : null,
        sample_size: quote?.count ?? 0,
        tier: quote?.evidenceTier ?? 'none',
        last_sold_date: quote?.lastSoldDate ?? null,
        last_sold_price: quote?.lastSoldPrice ?? null,
        spoken: spokenLine(name, brand, line, quote),
      },
      // Phase 1b section 3.4: a response carrying a tiered quote must not be
      // cached publicly past its cacheUntil, even though the route's own
      // baseline (voice queries repeat heavily during a show) is longer.
      { headers: { ...CACHE_HEADERS, 'Cache-Control': cacheControlFor(quote, CACHE_HEADERS['Cache-Control']) } },
    )
  } catch {
    return NextResponse.json({ error: 'no match' }, { status: 404, headers: CACHE_HEADERS })
  }
}

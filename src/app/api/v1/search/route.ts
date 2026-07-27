import { NextRequest, NextResponse } from 'next/server'
import { deriveName } from '@/data/kb'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'
import { searchKb, aggregateGenreFacets, MAX_RESULTS } from '../_lib/kbSearch'
import { searchGenreForFandom } from '@/lib/genreFigures'
import { checkRateLimit } from '@/lib/rateLimit'

/**
 * GET /api/v1/search?q=<query>&limit=<n>
 *
 * Searches local KB (figures-reference-v2.js) and returns ranked results.
 * Returns figure_id, image (canonical_image_url), and slug fields so the
 * client can build deep links and show thumbnails without a second request.
 *
 * Pagination model (W4, 2026-06-06): a single fetch returns the full ranked
 * result pool (up to MAX_RESULTS) and the client reveals it in batches via a
 * load-more button. This keeps one round-trip + one KB scan + edge-cacheable
 * responses, rather than offset pagination that re-scans the KB per page.
 *
 * Scoring + forgiveness ladder live in ../_lib/kbSearch.ts (extracted
 * 2026-06-10 S17 so /api/v1/price-check matches identically). When a
 * non-strict tier fires, the response carries a `note` string the client
 * surfaces above the results ("Showing results for …").
 *
 * Falls back to empty array if KB import fails — never throws.
 */
// S50 security audit (2026-07-02): pairs with the input caps in kbSearch. The
// scan is uncacheable when q is padded to defeat the CDN key, so a per-IP
// window bounds an abuser's request rate. Verified bots (Googlebot etc.) are
// exempt inside checkRateLimit — never throttle the crawl we're growing. 60/min
// is generous for interactive typeahead (each search = one fetch; load-more
// reveals client-side with no refetch), higher than sibling price-check's 30
// (a one-shot voice query) because this backs the live search box.
const RATE_LIMIT_PER_MINUTE = 60

export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(req, 'search', RATE_LIMIT_PER_MINUTE)
  if (rl.limited) {
    // no-store: this route's CDN cache key is the query string (shared across
    // users), so a per-IP 429 must never be cached and served to another IP.
    return NextResponse.json(
      { figures: [], error: 'rate_limited' },
      { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  // limit defaults to the full pool and is clamped to [1, MAX_RESULTS].
  //
  // 2026-07-27: this was a bare `Math.min(parseInt(...), MAX_RESULTS)` — a
  // ceiling with no floor and no NaN check, so the two ends leaked:
  //   ?limit=-1  → slice(0,-1) returned the pool MINUS its last row
  //                (measured: total 1620, figures 1619 — "all but last")
  //   ?limit=abc → NaN through slice() returned an EMPTY figures[] against a
  //                nonzero total, which reads to a client as "no matches"
  // Neither is a security hole (the pool is already bounded by MAX_RESULTS)
  // but both are wrong answers served with a 200. Clamp shape matches the
  // sibling that already had it right: api/daily-uniques/route.ts:132.
  // parseInt also now pins radix 10 rather than letting '0x…' reinterpret.
  const limitParam = parseInt(req.nextUrl.searchParams.get('limit') ?? '', 10)
  const limit = Math.min(
    MAX_RESULTS,
    Math.max(1, Number.isFinite(limitParam) ? limitParam : MAX_RESULTS),
  )

  // Edge cache headers — search is read-only over a static KB, fine to share
  // across users. 5 min fresh, 1 hour stale-while-revalidate.
  const CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
  }

  if (q.length < 2) {
    return NextResponse.json({ figures: [] }, { headers: CACHE_HEADERS })
  }

  try {
    const { scored, note } = searchKb(q)
    const total = scored.length

    const results = scored
      .slice(0, limit)
      .map(({ f }) => ({
        figure_id:          f.figure_id,
        name:               deriveName(f),
        brand:              prettifySlug(f.manufacturer),
        line:               prettifySlug(f.product_line),
        series:             f.release_wave,
        // Rolled up so the NECA family ('horror', 'aliens-predator',
        // 'terminator', 'robocop') matches the client's 'neca' genre pill —
        // see searchGenreForFandom's comment for why this is NOT
        // hubGenreForFandom. Every other fandom passes through unchanged.
        genre:              searchGenreForFandom(f.fandom),
        year:               null,
        image:              f.canonical_image_url ?? null,
        // Raw slugs — used by the client to build keyword-rich pretty URLs.
        // Deliberately NOT rolled up: these build /[genre]/[line]/[character]
        // paths, where the raw fandom is the correct segment.
        fandom_slug:        f.fandom,
        line_slug:          f.product_line,
        character_slug:     f.character_canonical,
      }))

    // `total` = full ranked match count (may exceed returned `figures` if it
    // hit MAX_RESULTS). `capped` tells the client there are matches beyond the
    // hard pool ceiling, so it can suggest narrowing instead of paging forever.
    // `facets` = fandom counts over the full pool (S54 genre pills).
    return NextResponse.json(
      { figures: results, total, capped: total >= MAX_RESULTS, note, facets: aggregateGenreFacets(scored) },
      { headers: CACHE_HEADERS },
    )
  } catch {
    return NextResponse.json({ figures: [] }, { headers: CACHE_HEADERS })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getAllFigures, deriveName } from '@/data/kb'
import { prettifySlug } from '@/app/figure/[figure_id]/_lib/figureFormatters'

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
 * Each result is ~10 short fields, so a 300-row payload is still small.
 *
 * Falls back to empty array if KB import fails — never throws.
 */
const MAX_RESULTS = 300

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  // limit defaults to the full pool; capped at MAX_RESULTS so a hand-crafted
  // ?limit=99999 can't force an unbounded payload.
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get('limit') ?? String(MAX_RESULTS)),
    MAX_RESULTS,
  )

  // Edge cache headers — search is read-only over a static KB, fine to share
  // across users. 5 min fresh, 1 hour stale-while-revalidate.
  const CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
  }

  if (q.length < 2) {
    return NextResponse.json({ figures: [] }, { headers: CACHE_HEADERS })
  }

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)

  try {
    const all = getAllFigures()

    const scored = all
      .map(f => {
        const char = f.character_canonical.toLowerCase()
        const name = deriveName(f).toLowerCase()
        const line = f.product_line.toLowerCase().replace(/-/g, ' ')
        const brand = f.manufacturer.toLowerCase()
        const variant = (f.character_variant ?? '').toLowerCase()

        let score = 0
        for (const token of tokens) {
          if (char.startsWith(token)) score += 5
          else if (char.includes(token)) score += 3
          else if (name.includes(token)) score += 2
          else if (variant.includes(token)) score += 1.5
          else if (line.includes(token)) score += 1
          else if (brand.includes(token)) score += 0.5
          else return null // token matched nothing — exclude
        }
        return { f, score }
      })
      .filter((x): x is { f: ReturnType<typeof getAllFigures>[number]; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)

    const total = scored.length

    const results = scored
      .slice(0, limit)
      .map(({ f }) => ({
        figure_id:          f.figure_id,
        name:               deriveName(f),
        brand:              prettifySlug(f.manufacturer),
        line:               prettifySlug(f.product_line),
        series:             f.release_wave,
        genre:              f.fandom,
        year:               null,
        image:              f.canonical_image_url ?? null,
        // Raw slugs — used by the client to build keyword-rich pretty URLs
        fandom_slug:        f.fandom,
        line_slug:          f.product_line,
        character_slug:     f.character_canonical,
      }))

    // `total` = full ranked match count (may exceed returned `figures` if it
    // hit MAX_RESULTS). `capped` tells the client there are matches beyond the
    // hard pool ceiling, so it can suggest narrowing instead of paging forever.
    return NextResponse.json(
      { figures: results, total, capped: total >= MAX_RESULTS },
      { headers: CACHE_HEADERS },
    )
  } catch {
    return NextResponse.json({ figures: [] }, { headers: CACHE_HEADERS })
  }
}


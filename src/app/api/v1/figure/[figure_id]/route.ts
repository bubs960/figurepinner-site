import { NextRequest, NextResponse } from 'next/server'
import { getFigureById, deriveName } from '@/data/kbDb'
import { checkRateLimit } from '@/lib/rateLimit'

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
  'x-fp-kb-source': 'd1',
}

const NOT_FOUND_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
  'x-fp-kb-source': 'd1',
}

// Same guard as the sibling public v1 endpoint (price-check) — no auth on
// this route, so a fixed-window per-IP limiter is the only abuse guard.
const RATE_LIMIT_PER_MINUTE = 30

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ figure_id: string }> }
) {
  const rl = await checkRateLimit(req, 'v1-figure', RATE_LIMIT_PER_MINUTE)
  if (rl.limited) {
    // no-store, NOT CACHE_HEADERS. This response is per-IP and lives for one
    // minute; CACHE_HEADERS says `public, max-age=300, s-maxage=600`, which
    // invites a browser or shared cache node to serve one client's throttle
    // to everyone behind it for up to 10x its real lifetime. Matches the
    // pattern already used by the search and upc routes.
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const { figure_id } = await params
  const f = await getFigureById(figure_id)

  if (!f) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NOT_FOUND_HEADERS })
  }

  const titleCase = (s: string) =>
    s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return NextResponse.json({
    figure_id: f.figure_id,
    name: deriveName(f),
    brand: titleCase(f.manufacturer),
    line: titleCase(f.product_line),
    series: f.release_wave,
    genre: f.fandom,
    year: null,
    canonical_image_url: f.canonical_image_url ?? null,
    exclusive_to: f.exclusive_to ?? null,
    pack_size: f.pack_size,
    scale: f.scale ?? null,
  }, { headers: CACHE_HEADERS })
}

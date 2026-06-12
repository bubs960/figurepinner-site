/**
 * /api/genre-line-figures?genre=<genre>&line=<product_line>
 *
 * Figure rows for one product line of a genre — fetched by the genre page's
 * accordion when a non-first line is opened (S20 payload cut: the page no
 * longer serializes every line's cards into the RSC flight payload).
 *
 * Anonymous, public, KB-build-static data → s-maxage so the colo edge cache
 * (edge-cache-entry.mjs) stores it; TTL matches the genre page's revalidate.
 */
import type { NextRequest } from 'next/server'
import { figuresForLine } from '@/lib/genreFigures'

const SLUG_RE = /^[a-z0-9-]{1,80}$/

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const genre = searchParams.get('genre') ?? ''
  const line = searchParams.get('line') ?? ''

  if (!SLUG_RE.test(genre) || !SLUG_RE.test(line)) {
    return Response.json({ error: 'bad params' }, { status: 400 })
  }

  const figures = figuresForLine(genre, line)
  if (!figures.length) {
    return Response.json({ error: 'not found' }, { status: 404 })
  }

  return Response.json(
    { figures },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=82800' } },
  )
}

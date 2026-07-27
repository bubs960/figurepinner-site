import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/news
 *
 * Public, read-only feed of recent news_events. No auth.
 *
 * Query params:
 *   genre        — filter by genre slug
 *   figure_id    — filter to events linked to a specific figure
 *   limit        — default 20, max 100
 *   pinned_only  — if 'true', return only pinned items
 *
 * Ordering: pinned DESC, published_at DESC.
 * Edge cached 5 min — news is read-heavy, low write rate.
 */

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const genre = params.get('genre')?.trim() || null
  const figureId = params.get('figure_id')?.trim() || null
  const pinnedOnly = params.get('pinned_only') === 'true'
  // Floor as well as cap. Math.min alone let `?limit=-1` through to SQLite,
  // which treats a NEGATIVE LIMIT as unlimited — an unbounded table scan once
  // news_events has rows (it's empty today, so this never bit). NaN from a
  // non-numeric param also fell through, since every Math.min comparison with
  // NaN yields NaN. Clamp to [1, 100] and fall back to the default on garbage.
  const rawLimit = parseInt(params.get('limit') ?? '20', 10)
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20

  const where: string[] = ['published_at <= datetime(\'now\')']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const args: any[] = []
  if (genre) { where.push('genre = ?'); args.push(genre) }
  if (figureId) { where.push('figure_id = ?'); args.push(figureId) }
  if (pinnedOnly) { where.push('pinned = 1') }

  const sql = `
    SELECT id, title, body, url, genre, figure_id, pinned, published_at, created_at
    FROM news_events
    WHERE ${where.join(' AND ')}
    ORDER BY pinned DESC, published_at DESC
    LIMIT ?
  `
  args.push(limit)

  try {
    const { env } = await getCloudflareContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (env as any).DB as D1Database
    const { results } = await db.prepare(sql).bind(...args).all()
    return NextResponse.json({ events: results }, { headers: CACHE_HEADERS })
  } catch {
    return NextResponse.json({ events: [] }, { headers: CACHE_HEADERS })
  }
}

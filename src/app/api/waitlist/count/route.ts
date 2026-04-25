import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'

/**
 * GET /api/waitlist/count
 *
 * Public endpoint. Returns a FLOORED waitlist signup count for use as social
 * proof on the coming-soon page. We floor to the nearest 10 so a low count
 * (3 signups) doesn't render as embarrassing exact text. Falls back to null
 * if the count is too small to display socially (< 10).
 *
 * Cached at the edge for 60s — this is read-heavy display data, not auth-
 * sensitive.
 */

export async function GET() {
  try {
    const { env } = await getCloudflareContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (env as any).DB as D1Database
    if (!db) {
      return NextResponse.json({ count: null, floored: null })
    }
    const { results } = await db
      .prepare('SELECT COUNT(*) AS c FROM waitlist_signups')
      .all()
    const raw = (results[0] as { c: number } | undefined)?.c ?? 0

    // Floor to nearest 10 once we cross the social-proof threshold.
    // Below 10: return null so the client renders nothing (or a generic line).
    const floored = raw >= 10 ? Math.floor(raw / 10) * 10 : null

    return NextResponse.json(
      { count: raw, floored },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300' } },
    )
  } catch {
    return NextResponse.json({ count: null, floored: null })
  }
}

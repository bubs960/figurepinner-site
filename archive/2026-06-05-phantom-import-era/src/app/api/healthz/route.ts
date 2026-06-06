import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * GET /api/healthz
 *
 * Public unauthenticated lite-health endpoint for external monitoring
 * (Uptime Kuma, Pingdom, BetterStack, etc.). Returns minimal, non-sensitive
 * status so a 200 means "site + DB binding alive". No secrets, no counts,
 * no environment leakage — just liveness.
 *
 * Returns 200 on success, 503 on degradation. The body intentionally
 * returns less info than /api/admin/health which requires auth.
 *
 * Cached at the edge for 30s — uptime probes typically hit every 60s and
 * we don't need fresher than that for liveness.
 */

export async function GET() {
  let dbOk = false
  try {
    const { env } = await getCloudflareContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (env as any).DB as D1Database | undefined
    if (db) {
      // Cheapest possible query — D1 round trip without scanning any table.
      await db.prepare('SELECT 1').first()
      dbOk = true
    }
  } catch {
    dbOk = false
  }

  const status = dbOk ? 200 : 503
  return NextResponse.json(
    { ok: dbOk, db: dbOk, ts: new Date().toISOString() },
    {
      status,
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=30',
      },
    },
  )
}

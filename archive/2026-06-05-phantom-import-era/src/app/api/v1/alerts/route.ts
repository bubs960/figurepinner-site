import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { isUserPro, FREE_LIMITS } from '@/lib/proStatus'

/**
 * GET  /api/v1/alerts — list deal alerts for the authenticated user
 * POST /api/v1/alerts — create a new deal alert (free: max 3, Pro: unlimited)
 *
 * Auth: Clerk session cookie OR Bearer JWT (mobile app).
 */

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDB()
  const { results } = await db
    .prepare(`
      SELECT id, figure_id, name, brand, line, genre, target_price, is_active, created_at, last_triggered_at
      FROM alerts
      WHERE user_id = ?
      ORDER BY created_at DESC
    `)
    .bind(userId)
    .all()

  return NextResponse.json({ items: results })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    figure_id: string
    name: string
    brand?: string
    line?: string
    genre?: string
    target_price?: number
  }

  if (!body.figure_id || !body.name) {
    return NextResponse.json({ error: 'figure_id and name are required' }, { status: 400 })
  }

  const db = await getDB()

  // ── Free-tier gate ─────────────────────────────────────────────────────────
  const pro = await isUserPro()
  if (!pro) {
    const { results: existing } = await db
      .prepare('SELECT COUNT(*) as count FROM alerts WHERE user_id = ?')
      .bind(userId)
      .all()
    const count = (existing[0] as { count: number } | undefined)?.count ?? 0

    if (count >= FREE_LIMITS.ALERTS) {
      return NextResponse.json(
        {
          error: 'alerts_limit_reached',
          message: `Free accounts support ${FREE_LIMITS.ALERTS} price alerts. Upgrade to Pro for unlimited.`,
          limit: FREE_LIMITS.ALERTS,
          current: count,
          upgrade_url: '/pro',
        },
        { status: 402 },
      )
    }
  }
  // ── End gate ───────────────────────────────────────────────────────────────

  // Check for duplicate active alert on same figure
  const { results: dup } = await db
    .prepare(`SELECT id FROM alerts WHERE user_id = ? AND figure_id = ? AND is_active = 1`)
    .bind(userId, body.figure_id)
    .all()

  if (dup.length > 0) {
    return NextResponse.json(
      { error: 'already_watching', message: 'You already have an active alert for this figure.' },
      { status: 409 },
    )
  }

  const id = randomUUID()
  await db
    .prepare(`
      INSERT INTO alerts (id, user_id, figure_id, name, brand, line, genre, target_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id, userId, body.figure_id, body.name,
      body.brand ?? null, body.line ?? null, body.genre ?? null,
      body.target_price ?? 0,
    )
    .run()

  return NextResponse.json({ id }, { status: 201 })
}

import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

/**
 * POST /api/v1/devices — register a push notification token for a user's device.
 *
 * Called by the mobile app on launch / after notification permission granted.
 * Upserts on (user_id, token) — safe to call every app launch.
 *
 * Body: { token: string, platform: 'ios' | 'android' | 'web' }
 *
 * Auth: Clerk session cookie OR Bearer JWT.
 */

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    token?: string
    platform?: string
  }

  if (!body.token || typeof body.token !== 'string' || body.token.trim().length === 0) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  const platform = body.platform ?? 'ios'
  if (!['ios', 'android', 'web'].includes(platform)) {
    return NextResponse.json({ error: 'platform must be ios, android, or web' }, { status: 400 })
  }

  const db = await getDB()

  // Upsert: insert or update updated_at on conflict
  await db
    .prepare(`
      INSERT INTO devices (id, user_id, token, platform, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT (user_id, token) DO UPDATE SET
        platform   = excluded.platform,
        updated_at = datetime('now')
    `)
    .bind(randomUUID(), userId, body.token.trim(), platform)
    .run()

  return NextResponse.json({ ok: true }, { status: 201 })
}

/**
 * DELETE /api/v1/devices — unregister a push token (e.g., on sign-out).
 *
 * Body: { token: string }
 */
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { token?: string }
  if (!body.token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  const db = await getDB()
  await db
    .prepare(`DELETE FROM devices WHERE user_id = ? AND token = ?`)
    .bind(userId, body.token.trim())
    .run()

  return NextResponse.json({ ok: true })
}

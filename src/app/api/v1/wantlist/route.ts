import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

/**
 * GET  /api/v1/wantlist  — list active wantlist items for the authenticated user
 * POST /api/v1/wantlist  — add a figure to the wantlist (unlimited per pricing doc)
 *
 * Auth: Clerk session cookie OR Bearer JWT (mobile app).
 * Returns only rows with status='active'.
 * Wantlist is NOT gated — free users have unlimited entries per pricing doc.
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
      SELECT id, figure_id, name, brand, line, genre, target_price, added_at
      FROM wantlist_items
      WHERE user_id = ? AND status = 'active'
      ORDER BY added_at DESC
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

  // Check for duplicate — don't add the same figure twice
  const { results: existing } = await db
    .prepare(`
      SELECT id FROM wantlist_items
      WHERE user_id = ? AND figure_id = ? AND status = 'active'
    `)
    .bind(userId, body.figure_id)
    .all()

  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'already_in_wantlist', message: 'This figure is already in your want list.' },
      { status: 409 },
    )
  }

  const id = randomUUID()
  await db
    .prepare(`
      INSERT INTO wantlist_items (id, user_id, figure_id, name, brand, line, genre, target_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `)
    .bind(
      id, userId, body.figure_id, body.name,
      body.brand ?? null, body.line ?? null, body.genre ?? null,
      body.target_price ?? 0,
    )
    .run()

  return NextResponse.json({ id }, { status: 201 })
}

import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

async function getDB() {
  const { env } = await getCloudflareContext()
  return env.DB
}

// GET /api/wantlist — fetch all wantlist items for authenticated user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDB()
  const { results } = await db
    .prepare('SELECT * FROM wantlist_items WHERE user_id = ? ORDER BY added_at DESC')
    .bind(userId)
    .all()

  return NextResponse.json({ items: results })
}

// POST /api/wantlist — add figure to wantlist
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
  const id = randomUUID()

  await db
    .prepare(`
      INSERT INTO wantlist_items (id, user_id, figure_id, name, brand, line, genre, target_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      userId,
      body.figure_id,
      body.name,
      body.brand ?? null,
      body.line ?? null,
      body.genre ?? null,
      body.target_price ?? 0,
    )
    .run()

  return NextResponse.json({ id }, { status: 201 })
}

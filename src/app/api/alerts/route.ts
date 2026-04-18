import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

// GET /api/alerts — fetch all active alerts for authenticated user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDB()
  const { results } = await db
    .prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all()

  return NextResponse.json({ items: results })
}

// POST /api/alerts — create a new deal alert
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
      INSERT INTO alerts (id, user_id, figure_id, name, brand, line, genre, target_price)
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

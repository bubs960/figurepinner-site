import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

// GET /api/vault — fetch all vault items for authenticated user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDB()
  const { results } = await db
    .prepare('SELECT * FROM vault_items WHERE user_id = ? ORDER BY added_at DESC')
    .bind(userId)
    .all()

  return NextResponse.json({ items: results })
}

// POST /api/vault — add figure to vault
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    figure_id: string
    name: string
    brand?: string
    line?: string
    genre?: string
    paid?: number
    condition?: string
  }

  if (!body.figure_id || !body.name) {
    return NextResponse.json({ error: 'figure_id and name are required' }, { status: 400 })
  }

  const db = await getDB()
  const id = randomUUID()

  await db
    .prepare(`
      INSERT INTO vault_items (id, user_id, figure_id, name, brand, line, genre, paid, condition)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      userId,
      body.figure_id,
      body.name,
      body.brand ?? null,
      body.line ?? null,
      body.genre ?? null,
      body.paid ?? 0,
      body.condition ?? 'Loose',
    )
    .run()

  return NextResponse.json({ id }, { status: 201 })
}

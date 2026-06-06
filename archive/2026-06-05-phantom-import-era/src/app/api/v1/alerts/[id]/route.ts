import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/v1/alerts/:id — permanently remove a deal alert
 * PATCH  /api/v1/alerts/:id — update target_price or toggle is_active
 *
 * Ownership check enforced before any mutation.
 * Auth: Clerk session cookie OR Bearer JWT (mobile app).
 */

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = await getDB()

  const { results } = await db
    .prepare(`SELECT id FROM alerts WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .all()

  if (results.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db
    .prepare(`DELETE FROM alerts WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .run()

  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as {
    target_price?: number
    is_active?: boolean
  }

  if (body.target_price === undefined && body.is_active === undefined) {
    return NextResponse.json({ error: 'target_price or is_active is required' }, { status: 400 })
  }

  const db = await getDB()

  const { results } = await db
    .prepare(`SELECT id FROM alerts WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .all()

  if (results.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Build update clause dynamically — only set provided fields
  const setClauses: string[] = []
  const bindings: (string | number)[] = []

  if (body.target_price !== undefined) {
    setClauses.push('target_price = ?')
    bindings.push(body.target_price)
  }
  if (body.is_active !== undefined) {
    setClauses.push('is_active = ?')
    bindings.push(body.is_active ? 1 : 0)
  }

  bindings.push(id, userId)

  await db
    .prepare(`UPDATE alerts SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...bindings)
    .run()

  return NextResponse.json({ ok: true })
}

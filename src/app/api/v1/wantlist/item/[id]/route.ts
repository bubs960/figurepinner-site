import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/v1/wantlist/item/:id — soft-delete a wantlist item (status='removed')
 * PATCH  /api/v1/wantlist/item/:id — update target_price
 *
 * Note: path uses singular "item" (not "items") to match spec verbatim.
 * Ownership check enforced before any mutation.
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
    .prepare(`SELECT id FROM wantlist_items WHERE id = ? AND user_id = ? AND status = 'active'`)
    .bind(id, userId)
    .all()

  if (results.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db
    .prepare(`UPDATE wantlist_items SET status = 'removed' WHERE id = ? AND user_id = ?`)
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
  const body = await req.json() as { target_price?: number }

  if (body.target_price === undefined) {
    return NextResponse.json({ error: 'target_price is required' }, { status: 400 })
  }

  const db = await getDB()

  const { results } = await db
    .prepare(`SELECT id FROM wantlist_items WHERE id = ? AND user_id = ? AND status = 'active'`)
    .bind(id, userId)
    .all()

  if (results.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db
    .prepare(`UPDATE wantlist_items SET target_price = ? WHERE id = ? AND user_id = ?`)
    .bind(body.target_price, id, userId)
    .run()

  return NextResponse.json({ ok: true })
}

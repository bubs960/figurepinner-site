import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

// DELETE /api/wantlist/[id] — remove item from wantlist (must belong to user)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = await getDB()

  const { meta } = await db
    .prepare('DELETE FROM wantlist_items WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run()

  if (meta.changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

// PATCH /api/wantlist/[id] — update target_price
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as { target_price?: number }
  const db = await getDB()

  if (body.target_price === undefined) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { meta } = await db
    .prepare('UPDATE wantlist_items SET target_price = ? WHERE id = ? AND user_id = ?')
    .bind(body.target_price, id, userId)
    .run()

  if (meta.changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

// DELETE /api/alerts/[id] — remove alert (must belong to user)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = await getDB()

  const { meta } = await db
    .prepare('DELETE FROM alerts WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run()

  if (meta.changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

// PATCH /api/alerts/[id] — update target_price or toggle is_active
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as { target_price?: number; is_active?: boolean }
  const db = await getDB()

  if (body.target_price !== undefined) {
    await db
      .prepare('UPDATE alerts SET target_price = ? WHERE id = ? AND user_id = ?')
      .bind(body.target_price, id, userId)
      .run()
  }

  if (body.is_active !== undefined) {
    await db
      .prepare('UPDATE alerts SET is_active = ? WHERE id = ? AND user_id = ?')
      .bind(body.is_active ? 1 : 0, id, userId)
      .run()
  }

  return NextResponse.json({ ok: true })
}

import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

// DELETE /api/vault/[id] — remove item from vault (must belong to user)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = await getDB()

  const { meta } = await db
    .prepare('DELETE FROM vault_items WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run()

  if (meta.changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

// PATCH /api/vault/[id] — update paid price or condition
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as { paid?: number; condition?: string }
  const db = await getDB()

  const updates: string[] = []
  const values: unknown[] = []

  if (body.paid !== undefined) {
    updates.push('paid = ?')
    values.push(body.paid)
  }
  if (body.condition !== undefined) {
    updates.push('condition = ?')
    values.push(body.condition)
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  values.push(id, userId)

  const { meta } = await db
    .prepare(`UPDATE vault_items SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`)
    .bind(...values)
    .run()

  if (meta.changes === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

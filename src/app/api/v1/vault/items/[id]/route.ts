import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

/**
 * DELETE /api/v1/vault/items/:id — soft-delete a vault item (sets status='removed')
 *
 * Ownership check: only the item's owner can delete it.
 * Soft-delete preserves data for audit / undo — hard deletes are via /api/vault/:id.
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

  // Ownership check before update
  const { results } = await db
    .prepare(`SELECT id FROM vault_items WHERE id = ? AND user_id = ? AND status = 'active'`)
    .bind(id, userId)
    .all()

  if (results.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db
    .prepare(`UPDATE vault_items SET status = 'removed' WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .run()

  return NextResponse.json({ ok: true })
}

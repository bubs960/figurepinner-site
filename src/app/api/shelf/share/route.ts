import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

// POST /api/shelf/share — mint (or reuse) this user's Claiming Ritual
// "Share My Shelf" token. Idempotent: the same signed-in user always gets
// the SAME token back, so the share link stays stable across repeat clicks
// and the card behind it always renders their CURRENT counts (never a
// frozen snapshot at share-time) — see migrations/0005_shelf_shares.sql.
// Token is a random crypto.randomUUID(), never the user_id itself, so a
// leaked/guessed share link can't be used to enumerate accounts.
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDB()

  const existing = await db
    .prepare('SELECT token FROM shelf_shares WHERE user_id = ?')
    .bind(userId)
    .first<{ token: string }>()
  if (existing) return NextResponse.json({ token: existing.token })

  const token = randomUUID()
  try {
    await db
      .prepare('INSERT INTO shelf_shares (token, user_id) VALUES (?, ?)')
      .bind(token, userId)
      .run()
  } catch {
    // Race: another request for the same user inserted first (UNIQUE user_id).
    // Re-read rather than error — the caller just wants *a* valid token.
    const row = await db
      .prepare('SELECT token FROM shelf_shares WHERE user_id = ?')
      .bind(userId)
      .first<{ token: string }>()
    if (row) return NextResponse.json({ token: row.token })
    return NextResponse.json({ error: 'share_token_failed' }, { status: 500 })
  }

  return NextResponse.json({ token }, { status: 201 })
}

import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { isUserPro, FREE_LIMITS } from '@/lib/proStatus'

/**
 * GET  /api/v1/vault         — list active vault items for the authenticated user
 * POST /api/v1/vault         — add a figure to the vault (free: 25 limit, Pro: unlimited)
 *
 * Auth: Clerk session cookie OR Bearer JWT (mobile app uses JWT from Clerk JWT template).
 * Returns only rows with status='active' (soft-deleted rows are hidden).
 */

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

// ── Shared insert helper (same pattern as /api/vault) ────────────────────────
// Single source of truth for the INSERT — schema changes only need to land here.

interface VaultItemBody {
  figure_id: string
  name: string
  brand?: string
  line?: string
  genre?: string
  paid?: number
  condition?: string
}

async function insertVaultItem(
  db: D1Database,
  userId: string,
  body: VaultItemBody,
): Promise<string> {
  const id = randomUUID()
  await db
    .prepare(`
      INSERT INTO vault_items (id, user_id, figure_id, name, brand, line, genre, paid, condition, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
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
  return id
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDB()
  const { results } = await db
    .prepare(`
      SELECT id, figure_id, name, brand, line, genre, paid, condition, added_at
      FROM vault_items
      WHERE user_id = ? AND status = 'active'
      ORDER BY added_at DESC
    `)
    .bind(userId)
    .all()

  return NextResponse.json({ items: results })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as VaultItemBody

  if (!body.figure_id || !body.name) {
    return NextResponse.json({ error: 'figure_id and name are required' }, { status: 400 })
  }

  const db = await getDB()
  const pro = await isUserPro()

  // Pro users skip the free-tier count check entirely.
  if (pro) {
    const id = await insertVaultItem(db, userId, body)
    return NextResponse.json({ id }, { status: 201 })
  }

  // Free-tier: count current active items, hard-stop at the limit, tag a
  // "near limit" warning at 80% so the mobile client can show an upsell.
  const { results: existing } = await db
    .prepare(`SELECT COUNT(*) as count FROM vault_items WHERE user_id = ? AND status = 'active'`)
    .bind(userId)
    .all()
  const count = (existing[0] as { count: number } | undefined)?.count ?? 0

  if (count >= FREE_LIMITS.VAULT) {
    return NextResponse.json(
      {
        error: 'vault_limit_reached',
        message: `Free vault holds ${FREE_LIMITS.VAULT} figures. Upgrade to Pro for unlimited storage.`,
        limit: FREE_LIMITS.VAULT,
        current: count,
        upgrade_url: 'https://figurepinner.com/pro',
      },
      { status: 402 },
    )
  }

  const id = await insertVaultItem(db, userId, body)

  const nearLimit = count + 1 >= Math.floor(FREE_LIMITS.VAULT * 0.8)
  return NextResponse.json(
    {
      id,
      ...(nearLimit
        ? {
            warning: 'vault_near_limit',
            message: `${FREE_LIMITS.VAULT - count - 1} vault spots remaining on Free. Upgrade to Pro for unlimited.`,
            remaining: FREE_LIMITS.VAULT - count - 1,
            upgrade_url: 'https://figurepinner.com/pro',
          }
        : {}),
    },
    { status: 201 },
  )
}

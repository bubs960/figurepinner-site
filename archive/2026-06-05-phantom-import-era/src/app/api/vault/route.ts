import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { isUserPro, FREE_LIMITS } from '@/lib/proStatus'

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

// ── Shared insert helper ─────────────────────────────────────────────────────
// Both the free-tier and Pro paths drop a row into vault_items with the same
// columns. Keeping this in one place means a schema change is a one-edit fix
// and prevents the two paths from drifting out of sync.

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

// GET /api/vault — fetch all vault items for authenticated user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDB()
  const { results } = await db
    .prepare("SELECT * FROM vault_items WHERE user_id = ? AND status = 'active' ORDER BY added_at DESC")
    .bind(userId)
    .all()

  return NextResponse.json({ items: results })
}

// POST /api/vault — add figure to vault
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

  // Free-tier: count current active items, hard-stop at the limit, and tag a
  // "near limit" warning on the response when we cross the 80% mark so the
  // client can show an upsell nudge before the user hits the wall.
  const { results: existing } = await db
    .prepare("SELECT COUNT(*) as count FROM vault_items WHERE user_id = ? AND status = 'active'")
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
        upgrade_url: '/pro',
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
            upgrade_url: '/pro',
          }
        : {}),
    },
    { status: 201 },
  )
}

import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

// GET /api/vault/status?figure_id=X — single-figure ownership check.
// Powers the Claiming Ritual's ambient brass corner pin (Phase A graft) and
// FigureActions' on-load "already owned" state. Deliberately its own tiny
// endpoint rather than reusing GET /api/vault (which returns the user's
// entire vault) — this is called on every figure-page view, so it stays a
// single indexed lookup instead of a full-table fetch.
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ owned: false }, { status: 401 })

  const figureId = req.nextUrl.searchParams.get('figure_id')
  if (!figureId) return NextResponse.json({ error: 'figure_id is required' }, { status: 400 })

  const db = await getDB()
  const row = await db
    .prepare("SELECT 1 FROM vault_items WHERE user_id = ? AND figure_id = ? AND status = 'active' LIMIT 1")
    .bind(userId, figureId)
    .first()

  return NextResponse.json({ owned: row != null })
}

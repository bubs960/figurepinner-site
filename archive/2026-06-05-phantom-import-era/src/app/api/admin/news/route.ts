import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

/**
 * POST /api/admin/news
 *
 * Authoring endpoint for news_events. Gated by the same FP_ADMIN_USER_IDS
 * allowlist as /api/admin/health — only listed Clerk userIds can write.
 *
 * Body (JSON):
 *   title          (required) — headline (max 200 chars)
 *   body           (optional) — short description / markdown allowed
 *   url            (optional) — external source URL
 *   genre          (optional) — slug like 'wrestling', 'marvel'
 *   figure_id      (optional) — links the event to a specific figure
 *   pinned         (optional) — boolean, default false
 *   published_at   (optional) — ISO timestamp; defaults to now (allows future-dated scheduling)
 *
 * Returns: { id } on success
 */

interface NewsEventBody {
  title?: string
  body?: string
  url?: string
  genre?: string
  figure_id?: string
  pinned?: boolean
  published_at?: string
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allowList = (process.env.FP_ADMIN_USER_IDS ?? '')
    .split(',').map(s => s.trim()).filter(Boolean)
  if (allowList.length === 0) {
    return NextResponse.json({ error: 'admin_endpoint_not_configured' }, { status: 503 })
  }
  if (!allowList.includes(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: NewsEventBody
  try {
    body = (await req.json()) as NewsEventBody
  } catch {
    return NextResponse.json({ error: 'bad_body' }, { status: 400 })
  }

  const title = body.title?.trim()
  if (!title) {
    return NextResponse.json({ error: 'title_required' }, { status: 400 })
  }
  if (title.length > 200) {
    return NextResponse.json({ error: 'title_too_long', max: 200 }, { status: 400 })
  }

  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (env as any).DB as D1Database

  const id = randomUUID()
  try {
    await db.prepare(`
      INSERT INTO news_events (id, title, body, url, genre, figure_id, pinned, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))
    `).bind(
      id,
      title,
      body.body?.trim() || null,
      body.url?.trim() || null,
      body.genre?.trim() || null,
      body.figure_id?.trim() || null,
      body.pinned ? 1 : 0,
      body.published_at?.trim() || null,
    ).run()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('news insert failed', msg)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ id }, { status: 201 })
}

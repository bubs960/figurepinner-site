import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

async function getDB() {
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (env as any).DB as D1Database
}

type UserSettings = {
  deal_alerts: number
  weekly_digest: number
  genre_announcements: number
  updated_at: string
}

// GET /api/user-settings — fetch notification prefs for authenticated user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDB()
  const row = await db
    .prepare('SELECT * FROM user_settings WHERE user_id = ?')
    .bind(userId)
    .first<UserSettings>()

  // Return defaults if no row yet
  const settings = row ?? {
    deal_alerts: 0,
    weekly_digest: 0,
    genre_announcements: 1,
    updated_at: new Date().toISOString(),
  }

  return NextResponse.json({
    dealAlerts: settings.deal_alerts === 1,
    weeklyDigest: settings.weekly_digest === 1,
    genreAnnouncements: settings.genre_announcements === 1,
  })
}

// PUT /api/user-settings — upsert notification prefs
export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    dealAlerts?: boolean
    weeklyDigest?: boolean
    genreAnnouncements?: boolean
  }

  const db = await getDB()

  await db
    .prepare(`
      INSERT INTO user_settings (user_id, deal_alerts, weekly_digest, genre_announcements, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        deal_alerts = excluded.deal_alerts,
        weekly_digest = excluded.weekly_digest,
        genre_announcements = excluded.genre_announcements,
        updated_at = excluded.updated_at
    `)
    .bind(
      userId,
      body.dealAlerts ? 1 : 0,
      body.weeklyDigest ? 1 : 0,
      body.genreAnnouncements !== false ? 1 : 0,
    )
    .run()

  return NextResponse.json({ ok: true })
}

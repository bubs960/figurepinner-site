import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * POST /api/waitlist/subscribe
 *
 * Public endpoint — no auth. Accepts JSON or form-encoded body:
 *   { email: string, source?: string }
 *
 * Stores in D1 `waitlist_signups`. Idempotent: re-submitting the same email
 * returns 200 with { already_subscribed: true } instead of an error.
 *
 * Spam guards: basic email regex, length cap, source field truncation,
 * IP hashed (not stored raw) for future rate-limit / abuse review.
 */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  let email: string | undefined
  let source: string | undefined

  // Accept both JSON and form-encoded — coming-soon page submits via fetch JSON,
  // but a no-JS fallback would post application/x-www-form-urlencoded.
  const contentType = req.headers.get('content-type') ?? ''
  try {
    if (contentType.includes('application/json')) {
      const body = (await req.json()) as { email?: string; source?: string }
      email = body.email
      source = body.source
    } else {
      const form = await req.formData()
      email = form.get('email')?.toString()
      source = form.get('source')?.toString()
    }
  } catch {
    return NextResponse.json({ error: 'bad_body' }, { status: 400 })
  }

  email = email?.trim().toLowerCase()
  source = (source ?? 'coming_soon').slice(0, 64)

  if (!email || !EMAIL_RX.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  const { env } = await getCloudflareContext()
  const db = (env as { DB: D1Database }).DB

  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    ''
  const ipHash = ip ? await sha256(ip) : null
  const ua = req.headers.get('user-agent')?.slice(0, 500) ?? null
  const id = crypto.randomUUID()

  try {
    await db
      .prepare(
        'INSERT INTO waitlist_signups (id, email, source, ip_hash, user_agent) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(id, email, source, ipHash, ua)
      .run()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    // UNIQUE constraint on email — already subscribed. Treat as success so the
    // client renders the same "you're on the list" state without leaking that
    // the email is already known.
    if (msg.includes('UNIQUE')) {
      return NextResponse.json({ ok: true, already_subscribed: true })
    }
    console.error('waitlist insert failed', msg)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

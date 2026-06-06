import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * GET /api/alerts/unsubscribe?token=...
 *
 * One-click unsubscribe from a deal alert. No auth required.
 * Token is HMAC-SHA256 signed to prevent spoofing.
 *
 * Token format (URL-safe base64): base64url("{alertId}|{timestamp}")
 * with a separate `sig` param carrying the hex HMAC.
 *
 * Required env var (set in Cloudflare dashboard):
 *   UNSUBSCRIBE_SECRET — random 32+ char string, same value used in alerts worker
 *
 * On success:  redirect → /alerts/unsubscribed?name=...
 * On failure:  redirect → /alerts/unsubscribed?error=1
 */

const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days — alert emails are batched daily

async function verifyToken(
  alertId: string,
  timestamp: string,
  sig: string,
  secret: string,
): Promise<boolean> {
  try {
    const payload = `${alertId}|${timestamp}`
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signatureBytes = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
    const expected = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Constant-time comparison
    if (expected.length !== sig.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
    return diff === 0
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const alertId   = searchParams.get('id')
  const timestamp = searchParams.get('ts')
  const sig       = searchParams.get('sig')
  const name      = searchParams.get('name') ?? ''

  const base = req.nextUrl.origin

  if (!alertId || !timestamp || !sig) {
    return NextResponse.redirect(`${base}/alerts/unsubscribed?error=1`)
  }

  // Check token age
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts) || Date.now() - ts > TOKEN_MAX_AGE_MS) {
    return NextResponse.redirect(`${base}/alerts/unsubscribed?error=expired`)
  }

  // Get env (same pattern as /api/alerts/route.ts)
  const { env } = await getCloudflareContext()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = env as any
  const secret: string | undefined = e.UNSUBSCRIBE_SECRET

  if (!secret) {
    console.error('[unsubscribe] UNSUBSCRIBE_SECRET not set')
    return NextResponse.redirect(`${base}/alerts/unsubscribed?error=1`)
  }

  const valid = await verifyToken(alertId, timestamp, sig, secret)
  if (!valid) {
    return NextResponse.redirect(`${base}/alerts/unsubscribed?error=invalid`)
  }

  // Deactivate the alert — no user auth needed, token is proof enough
  try {
    const db = e.DB as D1Database
    await db
      .prepare('UPDATE alerts SET is_active = 0 WHERE id = ?')
      .bind(alertId)
      .run()
  } catch (e) {
    console.error('[unsubscribe] D1 update failed:', e)
    return NextResponse.redirect(`${base}/alerts/unsubscribed?error=1`)
  }

  const encodedName = encodeURIComponent(name)
  return NextResponse.redirect(`${base}/alerts/unsubscribed?name=${encodedName}`)
}

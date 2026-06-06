import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isUserPro } from '@/lib/proStatus'

/**
 * GET /api/v1/me — return authenticated user identity + Pro status.
 *
 * Called by the mobile app on launch to:
 *   1. Verify the JWT is still valid.
 *   2. Check isPro without decoding Clerk JWT claims (publicMetadata is not
 *      embedded in the JWT — it requires a server-side lookup).
 *
 * Auth: Clerk session cookie OR Bearer JWT (mobile app).
 *
 * Response:
 *   { userId: string, isPro: boolean }
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isPro = await isUserPro()

  return NextResponse.json({ userId, isPro })
}

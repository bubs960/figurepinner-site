import { checkRateLimit } from '@/lib/rateLimit'
import type { AdminDenial } from '@/lib/requireAdmin'

/**
 * Per-IP throttle for the six admin/ops routes gated by requireAdmin().
 *
 * Runs BEFORE the credential check so guessing the shared secret (or probing
 * the Clerk allowlist) is throttled too. Same limiter and same 429 shape as
 * daily-uniques' debug branch: `{ error: 'rate_limited' }`, Cache-Control
 * no-store, Retry-After.
 *
 * One bucket per route (`admin-<route>`) so hammering one endpoint never
 * locks an operator out of another. The route name is a closed union so a
 * typo can't silently merge two buckets.
 *
 * Fails OPEN: any limiter error returns null (proceed exactly as before).
 * checkRateLimit already fails open on Cache API errors; the try/catch here
 * also covers anything thrown outside its own try (e.g. a malformed request
 * object), so the limiter can never turn a request into a 500.
 */

export const ADMIN_RATE_LIMIT_PER_MINUTE = 30

export type AdminRateLimitRoute =
  | 'health'
  | 'kv-audit'
  | 'news'
  | 'cache-stats'
  | 'daily-uniques'
  | 'funnel-stats'

export async function adminRateLimit(request: Request, route: AdminRateLimitRoute): Promise<AdminDenial | null> {
  try {
    const rl = await checkRateLimit(request, `admin-${route}`, ADMIN_RATE_LIMIT_PER_MINUTE)
    if (!rl.limited) return null
    return {
      status: 429,
      body: { error: 'rate_limited' },
      headers: { 'Cache-Control': 'no-store', 'Retry-After': String(rl.retryAfter) },
    }
  } catch {
    return null
  }
}

import { timingSafeEqual } from '@/lib/timingSafeEqual'

/**
 * Shared admin/ops gate for internal API routes. Two independent mechanisms
 * existed side by side before this was extracted (PR #33 made both
 * constant-time; this only de-duplicates the surrounding branching):
 *
 *  - 'secret': a shared-secret header compared with `timingSafeEqual`
 *    (cache-stats, daily-uniques, funnel-stats).
 *  - 'allowlist': a signed-in Clerk userId checked against the
 *    FP_ADMIN_USER_IDS allowlist (admin/health, admin/kv-audit, admin/news).
 *
 * Callers still resolve their own Clerk `userId` — this stays a plain
 * function over explicit inputs (no Next/Clerk imports) so it never needs
 * request-context plumbing and stays trivially unit-testable. It returns a
 * plain denial descriptor rather than a NextResponse so callers build the
 * response with `NextResponse.json(denial.body, { status: denial.status,
 * headers: denial.headers })`; returns null to proceed.
 */

export interface AdminDenial {
  status: number
  body: Record<string, unknown>
  headers?: Record<string, string>
}

interface SecretGateOptions {
  kind: 'secret'
  request: Request
  /** Header name the caller reads the secret from, e.g. 'x-cache-stats-key'. */
  header: string
  /** Env var name holding the expected secret, e.g. 'CACHE_STATS_KEY'. */
  envVar: string
}

interface AllowlistGateOptions {
  kind: 'allowlist'
  userId: string | null
  /**
   * What an empty/unset FP_ADMIN_USER_IDS means:
   *  - 'not_configured' (default): always 503 admin_endpoint_not_configured,
   *    regardless of whether userId is set. Matches admin/health and
   *    admin/news.
   *  - 'forbidden': an empty allowlist is treated like "signed in but not on
   *    the list" — 403 Forbidden when userId is present, 401 when it isn't.
   *    Matches admin/kv-audit's pre-existing isAllowedAdmin() behavior.
   */
  emptyAllowlist?: 'not_configured' | 'forbidden'
  /** Extra `message` field on the 503 body (admin/health only). */
  notConfiguredMessage?: string
}

const NO_STORE = { 'Cache-Control': 'no-store' }

export function requireAdmin(options: SecretGateOptions | AllowlistGateOptions): AdminDenial | null {
  if (options.kind === 'secret') {
    const { request, header, envVar } = options
    const expectedKey = process.env[envVar]
    if (!expectedKey) {
      return { status: 503, body: { error: 'admin_endpoint_not_configured' }, headers: NO_STORE }
    }
    if (!timingSafeEqual(request.headers.get(header) ?? '', expectedKey)) {
      return { status: 401, body: { error: 'unauthorized' }, headers: NO_STORE }
    }
    return null
  }

  const { userId, emptyAllowlist = 'not_configured', notConfiguredMessage } = options
  if (!userId) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }

  const allowList = (process.env.FP_ADMIN_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (allowList.length === 0) {
    if (emptyAllowlist === 'not_configured') {
      return {
        status: 503,
        body: notConfiguredMessage
          ? { error: 'admin_endpoint_not_configured', message: notConfiguredMessage }
          : { error: 'admin_endpoint_not_configured' },
      }
    }
    return { status: 403, body: { error: 'Forbidden' } }
  }

  if (!allowList.includes(userId)) {
    return { status: 403, body: { error: 'Forbidden' } }
  }

  return null
}

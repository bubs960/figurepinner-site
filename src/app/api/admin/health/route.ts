import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/health
 *
 * Self-service diagnostic — what's wired, what's not. Returns a JSON snapshot
 * of secret presence, feature flags, and live D1 counts. Cheaper than asking
 * an engineer "is X set?" every time.
 *
 * Auth: Clerk userId must appear in FP_ADMIN_USER_IDS (comma-separated env).
 * If the env var is unset, the endpoint refuses to respond — no accidental
 * exposure of config details to a random signed-in user.
 *
 * Notes:
 *   - We never return secret VALUES. Only boolean "is it set?" flags.
 *   - D1 counts are best-effort; failures degrade to null instead of 500.
 */

interface HealthSnapshot {
  ok: boolean
  ts: string
  env: {
    coming_soon_mode: boolean
    coming_soon_bypass_set: boolean
    stripe_enabled_flag: boolean
    clerk_publishable_live: boolean
    clerk_secret_set: boolean
    clerk_webhook_secret_set: boolean
    stripe_secret_set: boolean
    stripe_webhook_secret_set: boolean
    stripe_pro_monthly_price_id_set: boolean
    stripe_pro_annual_price_id_set: boolean
    api_base_set: boolean
    ebay_campaign_id_set: boolean
  }
  d1: {
    reachable: boolean
    waitlist_count: number | null
    vault_active_count: number | null
    wantlist_active_count: number | null
    alerts_active_count: number | null
    devices_count: number | null
    news_events_count: number | null
  }
  kv: {
    pro_kv_reachable: boolean
  }
  notes: string[]
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowList = (process.env.FP_ADMIN_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (allowList.length === 0) {
    return NextResponse.json(
      {
        error: 'admin_endpoint_not_configured',
        message: 'Set FP_ADMIN_USER_IDS env var on the worker (comma-separated Clerk user IDs).',
      },
      { status: 503 },
    )
  }

  if (!allowList.includes(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ─── Env / secret presence ───────────────────────────────────────────────
  const pkPub = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
  const env = {
    coming_soon_mode: process.env.COMING_SOON_MODE !== 'false',
    coming_soon_bypass_set: !!process.env.COMING_SOON_BYPASS || true, // hardcoded in middleware
    stripe_enabled_flag: process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true',
    clerk_publishable_live: pkPub.startsWith('pk_live_'),
    clerk_secret_set: !!process.env.CLERK_SECRET_KEY,
    clerk_webhook_secret_set: !!process.env.CLERK_WEBHOOK_SECRET,
    stripe_secret_set: !!process.env.STRIPE_SECRET_KEY,
    stripe_webhook_secret_set: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripe_pro_monthly_price_id_set: !!(
      process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? process.env.STRIPE_PRO_PRICE_ID
    ),
    stripe_pro_annual_price_id_set: !!process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    api_base_set: !!process.env.NEXT_PUBLIC_API_BASE,
    ebay_campaign_id_set: !!process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID,
  }

  // ─── D1 counts ───────────────────────────────────────────────────────────
  const d1: HealthSnapshot['d1'] = {
    reachable: false,
    waitlist_count: null,
    vault_active_count: null,
    wantlist_active_count: null,
    alerts_active_count: null,
    devices_count: null,
    news_events_count: null,
  }
  const kv: HealthSnapshot['kv'] = {
    pro_kv_reachable: false,
  }

  try {
    const { env: cfEnv } = await getCloudflareContext()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfAny = cfEnv as any
    kv.pro_kv_reachable = !!cfAny?.PRO_KV
    const db = cfAny.DB as D1Database
    if (db) {
      const queries = [
        ['waitlist_count',         "SELECT COUNT(*) c FROM waitlist_signups"],
        ['vault_active_count',     "SELECT COUNT(*) c FROM vault_items WHERE status='active'"],
        ['wantlist_active_count',  "SELECT COUNT(*) c FROM wantlist_items WHERE status='active'"],
        ['alerts_active_count',    "SELECT COUNT(*) c FROM alerts WHERE is_active=1"],
        ['devices_count',          "SELECT COUNT(*) c FROM devices"],
        ['news_events_count',      "SELECT COUNT(*) c FROM news_events"],
      ] as const

      for (const [key, sql] of queries) {
        try {
          const { results } = await db.prepare(sql).all()
          const row = results[0] as { c: number } | undefined
          d1[key] = row?.c ?? 0
        } catch {
          d1[key] = null
        }
      }
      d1.reachable = true
    }
  } catch {
    d1.reachable = false
  }

  // ─── Heuristic notes ─────────────────────────────────────────────────────
  const notes: string[] = []
  if (!env.clerk_publishable_live) {
    notes.push('Clerk publishable is NOT pk_live — site is in dev/test mode for Clerk.')
  }
  if (!env.stripe_secret_set || !env.stripe_webhook_secret_set) {
    notes.push('Stripe secrets incomplete — checkout would 503 (graceful) but Pro flow inactive.')
  }
  if (env.stripe_enabled_flag && !env.stripe_secret_set) {
    notes.push('CRITICAL: Stripe feature flag is ON but secrets are MISSING — flip flag off until secrets are wired.')
  }
  if (!env.coming_soon_mode) {
    notes.push('Coming-soon gate is OFF — site is fully public.')
  }
  if (!kv.pro_kv_reachable) {
    notes.push('PRO_KV binding not found — isUserPro() will fall through to Clerk on every call. Verify wrangler.toml has the [[kv_namespaces]] block.')
  }
  if (d1.waitlist_count !== null && d1.waitlist_count > 0) {
    notes.push(`${d1.waitlist_count} waitlist signup${d1.waitlist_count === 1 ? '' : 's'} captured.`)
  }

  const snapshot: HealthSnapshot = {
    ok: true,
    ts: new Date().toISOString(),
    env,
    d1,
    kv,
    notes,
  }

  return NextResponse.json(snapshot, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

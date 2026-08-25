import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkRateLimit } from '@/lib/rateLimit'
import { FUNNEL_EVENTS } from '@/lib/funnelEvents'

export const dynamic = 'force-dynamic'

// Sourced from the same FUNNEL_EVENTS the client's FunnelEvent type derives
// from (src/lib/funnelEvents.ts) — a route.ts file can't add its own named
// export (Next's route-segment-config type checker rejects anything beyond
// the reserved HTTP-verb/config set, same restriction page.tsx has), so
// tests/funnelAllowlist.test.mjs imports FUNNEL_EVENTS directly rather than
// this Set.
const ALLOWED_EVENTS = new Set<string>(FUNNEL_EVENTS)

// S3 (hygiene plan, 2026-07-02): /api/funnel is an unauthenticated,
// unauthenticated-by-design first-party beacon (S44) — anyone can POST to it
// from anywhere, and the funnel numbers are about to grade real ad spend
// (Reddit campaign, R1 clock). These are integrity guards, not an auth gate:
//   1. Origin/Referer must be figurepinner.com (or absent — same-tab
//      sendBeacon/fetch calls on some browsers omit both; blocking those
//      would blind us to real traffic, so "unset" is allowed through).
//   2. Verified-bot traffic (crawlers) never writes a funnel row — a funnel
//      event describes a *user* journey.
//   3. Soft per-IP cap via the shared limiter — generous, this is meant to
//      stop scripted spam, not throttle a real user clicking around.
//
// Dataset scope (updated 2026-08-25, Steve-ruled): this dataset is SESSION-
// JOINABLE, not anonymous-aggregate — sessionId (blob13 below) ties events
// back to the same visitor so a real journey (landing -> impression ->
// viewable -> click -> signup) can be reconstructed. Treat it accordingly —
// do not assume rows are anonymous just because no other PII is collected.
const ALLOWED_HOSTS = new Set(['figurepinner.com', 'www.figurepinner.com'])
const SOFT_LIMIT_PER_MINUTE = 60

function hostAllowed(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const source = origin || referer
  if (!source) return true // no Origin/Referer sent — allow (see comment above)
  try {
    return ALLOWED_HOSTS.has(new URL(source).hostname)
  } catch {
    return false // malformed Origin/Referer — reject rather than guess
  }
}

function isVerifiedBotRequest(request: NextRequest): boolean {
  const cf = (request as unknown as { cf?: { verifiedBotCategory?: string } }).cf
  return Boolean(cf?.verifiedBotCategory)
}

function clean(value: unknown, max = 160): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

// 0 default for an absent optional numeric detail field — these are only
// ever meaningful for the ONE event type each is sent from (comp_count on
// price_receipt_open, point_count on sparkline_drawn, figures/coverage on
// shelf_ticker_open); every other event legitimately has nothing to report
// here, and 0 reads correctly as "not applicable" when queried per-index1.
function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function routeBucket(path: string): string {
  if (!path || path === '/') return 'home'
  if (path.startsWith('/figure/')) return 'figure'
  if (path.startsWith('/search')) return 'search'
  const part = path.split('/').filter(Boolean)[0]
  return part || 'home'
}

// This metric is about to grade real ad spend (C6, WEBAUDIT-FINAL-CYCLE-
// PLAN-2026-07-12.md §4) — a silently-missing binding or silently-failed
// write can no longer be invisible. `analytics?.writeDataPoint(...)`'s
// optional chaining made a MISSING binding a no-op that never even reached
// the catch below; warn explicitly for that case once per isolate (not once
// ever — a fresh isolate after a redeploy/binding fix should warn again if
// the problem persists) rather than spamming a warn on every request.
let missingBindingWarned = false

export async function POST(request: NextRequest) {
  if (!hostAllowed(request)) {
    return new Response(null, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  }
  if (isVerifiedBotRequest(request)) {
    // Silently accept-and-drop rather than error — a crawler poking this
    // endpoint isn't an incident, it just shouldn't pollute the dataset.
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  }
  const rl = await checkRateLimit(request, 'funnel', SOFT_LIMIT_PER_MINUTE)
  if (rl.limited) {
    return new Response(null, {
      status: 429,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': String(rl.retryAfter) },
    })
  }

  let body: Record<string, unknown> | null = null
  try {
    body = await request.json()
  } catch {
    return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const event = clean(body?.event, 40)
  if (!ALLOWED_EVENTS.has(event)) {
    return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const path = clean(body?.path, 180)
  const search = clean(body?.search, 240)
  const source = clean(body?.source, 80)
  const figureId = clean(body?.figureId, 120)
  const query = clean(body?.query, 100)
  const referrer = clean(body?.referrer, 120)
  const sessionId = clean(body?.sessionId, 80)
  const target = clean(body?.target, 80)
  const flight = clean(body?.flight, 20)
  const figureName = clean(body?.figure_name, 160)
  const method = clean(body?.method, 20)
  const pointCount = num(body?.point_count)
  const compCount = num(body?.comp_count)
  const figures = num(body?.figures)
  const coverage = num(body?.coverage)

  try {
    const { env } = await getCloudflareContext()
    const analytics = (env as { FUNNEL_ANALYTICS?: AnalyticsEngineDataset }).FUNNEL_ANALYTICS
    if (!analytics) {
      if (!missingBindingWarned) {
        missingBindingWarned = true
        console.warn('[funnel] FUNNEL_ANALYTICS binding is absent — events are being silently dropped')
      }
    } else {
      // writeDataPoint is synchronous (returns void, not a Promise) on CF's
      // AnalyticsEngineDataset binding — there is nothing to await here. Do NOT
      // "fix" this into `await analytics.writeDataPoint(...)`; that would await
      // a non-Promise value (a no-op) while looking like a real fix.
      analytics.writeDataPoint({
        // Positional — funnel-stats/route.ts's SQL reads specific blobN/
        // doubleN indices. New fields are ALWAYS appended at the end, never
        // inserted/reordered, so existing queries never silently shift.
        blobs: [
          event,           // blob1
          source || 'unknown', // blob2
          routeBucket(path), // blob3
          path,            // blob4
          figureId,        // blob5
          query,           // blob6
          referrer,        // blob7
          target,          // blob8
          flight,          // blob9
          search,          // blob10
          figureName,      // blob11
          method,          // blob12
          sessionId,       // blob13 -- APPROVED 2026-08-25 (Steve, via standalone) to make
                            // funnel events session-joinable: seeing a real visitor's path
                            // (landing -> impression -> viewable -> click -> signup) needs
                            // ties back to the same visitor, which an anonymous-aggregate
                            // dataset can't support. Dataset is session-joinable as of this
                            // field, not anonymous -- see STANDALONE-TO-WEBAUDIT-FUNNEL-
                            // SESSION-RULING-2026-08-25.md.
        ],
        doubles: [1, pointCount, compCount, figures, coverage],
        indexes: [event],
      })
    }
  } catch (err) {
    // Tracking must never affect the user path — but a write failure must not
    // vanish silently either (same silent-swallow class as the GraphQL lesson).
    console.warn('[funnel] writeDataPoint failed', event, err instanceof Error ? err.message : String(err))
  }

  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}

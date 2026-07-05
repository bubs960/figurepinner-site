import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const ALLOWED_EVENTS = new Set([
  'landing',
  'search_submit',
  'search_result_click',
  'figure_view',
  'ebay_exit',
  'price_receipt_open',
  'ad_impression',
  'shelf_ticker_open',
])

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

function routeBucket(path: string): string {
  if (!path || path === '/') return 'home'
  if (path.startsWith('/figure/')) return 'figure'
  if (path.startsWith('/search')) return 'search'
  const part = path.split('/').filter(Boolean)[0]
  return part || 'home'
}

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
  const source = clean(body?.source, 80)
  const figureId = clean(body?.figureId, 120)
  const query = clean(body?.query, 100)
  const referrer = clean(body?.referrer, 120)
  const sessionId = clean(body?.sessionId, 80)
  const target = clean(body?.target, 80)

  try {
    const { env } = await getCloudflareContext()
    const analytics = (env as { FUNNEL_ANALYTICS?: AnalyticsEngineDataset }).FUNNEL_ANALYTICS
    // writeDataPoint is synchronous (returns void, not a Promise) on CF's
    // AnalyticsEngineDataset binding — there is nothing to await here. Do NOT
    // "fix" this into `await analytics?.writeDataPoint(...)`; that would await
    // a non-Promise value (a no-op) while looking like a real fix.
    analytics?.writeDataPoint({
      blobs: [
        event,
        source || 'unknown',
        routeBucket(path),
        path,
        figureId,
        query,
        referrer,
        target,
      ],
      doubles: [1],
      indexes: [event],
    })
  } catch {
    // Tracking must never affect the user path.
  }

  // sessionId is accepted to keep client sessions stable for future sampling,
  // but not written to Analytics Engine so the dataset stays anonymous.
  void sessionId

  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}

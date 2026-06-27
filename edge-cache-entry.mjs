/**
 * edge-cache-entry.mjs — custom Worker entry that wraps the OpenNext handler
 * with a colo-local edge cache (Cache API) for anonymous public GETs.
 *
 * WHY (S15, 2026-06-10): zone-level Cache Rules can NOT cache Worker-rendered
 * HTML (verified 6/9 — cf-cache-status absent on all HTML; zone "cached" rate
 * was assets-only). Every page view was running full SSR: CPU 623ms avg
 * (+285%) under bot-heavy traffic. This wrapper serves repeat anonymous views
 * from the colo cache without invoking Next at all.
 *
 * SAFETY GATES (all must pass before cache is touched):
 *  - GET only.
 *  - No Clerk auth cookies on the request (logged-in users always bypass).
 *  - No RSC / router-prefetch headers. Next App Router fetches RSC flight
 *    payloads from the SAME URL distinguished only by headers, and the Cache
 *    API ignores `Vary` — caching those would serve flight payloads to
 *    browsers (or HTML to the router). Plain document requests only.
 *  - Response stored only if: status 200, no Set-Cookie, Cache-Control has a
 *    positive s-maxage (route opted into shared caching — /search is
 *    private/no-store and /app pages have no s-maxage, so they self-exclude).
 *  - HTML TTL capped at 1h so a deploy fully propagates within the hour.
 *    (Emergency: Dashboard → Caching → Purge Everything also clears this.)
 *
 * OBSERVABILITY: every response gets `x-fp-edge: HIT | MISS | BYPASS`.
 *   S36 2026-06-19: also writes to Workers Analytics Engine (binding: ANALYTICS,
 *   dataset: fp_edge_cache) — fire-and-forget via waitUntil so it never adds
 *   latency. Query via /api/cache-stats or CF GraphQL. This is the only accurate
 *   HTML cache signal — CF zone "Cache rate %" is assets-only.
 *
 * Rollback: set `main = ".open-next/worker.js"` in wrangler.toml + redeploy.
 */
import handler from './.open-next/worker.js'

// OpenNext Durable Object classes must stay exported from the entry module.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'

/**
 * Signed-in detection (S41c refinement, 2026-06-22): the only reliable Clerk
 * signed-in marker is the `__session` JWT cookie. Match it only.
 *
 * The S15 logic also treated `__client_uat` with a NONZERO value as signed-in.
 * That assumption was wrong: Clerk leaves `__client_uat=<timestamp>` (a NONZERO
 * "last activity" tracker) persistently after sign-out, so any visitor who had
 * EVER signed in got permanent BYPASS forever — even completely anonymous
 * subsequent visits. Real fresh visitors with no Clerk cookies still hit the
 * cache, which is why cache-stats showed positive HIT% on Google traffic but
 * Steve's dogfooding browser always BYPASSED. Drop the `__client_uat` check;
 * `__session` is the only auth-real cookie. Diagnosed 2026-06-22 — the post-
 * clear-cookies probe on the same Chrome session flipped BYPASS→MISS.
 *
 * The `(?:^|;\s*)__session` pattern matches both `__session=...` and the
 * Clerk instance-suffixed `__session_xxxxx=...` variant.
 */
function hasAuthCookie(cookie) {
  // Token-strict: __session followed by `=` (top-level) or `_xxx=` (Clerk
  // instance-suffixed). Rejects `__sessionnnn=...` false-positives.
  return /(?:^|;\s*)__session(?:=|_[^=;]+=)/.test(cookie)
}
const RSC_HEADERS = ['rsc', 'next-router-state-tree', 'next-router-prefetch', 'next-url']
const HTML_TTL_CAP = 3600

// Marketing params that fragment the cache key without changing the page.
const STRIP_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'msclkid']

function cacheKeyFor(request) {
  const url = new URL(request.url)
  let changed = false
  for (const p of STRIP_PARAMS) {
    if (url.searchParams.has(p)) { url.searchParams.delete(p); changed = true }
  }
  url.searchParams.sort()
  return changed || url.search ? new Request(url.toString(), { method: 'GET' }) : request
}

function isCacheableRequest(request) {
  if (request.method !== 'GET') return false
  // Auth-shaped surfaces must never be colo-cached, even when rendered
  // anonymously (a cached dashboard shell reads as a broken signed-in state).
  const { pathname } = new URL(request.url)
  if (pathname === '/app' || pathname.startsWith('/app/') || pathname === '/admin' || pathname.startsWith('/admin/')) return false
  const cookie = request.headers.get('cookie')
  if (cookie && hasAuthCookie(cookie)) return false
  for (const h of RSC_HEADERS) {
    if (request.headers.has(h)) return false
  }
  return true
}

/** Positive s-maxage from a Cache-Control header, else 0. */
function sharedTtl(cc) {
  const m = /s-maxage=(\d+)/.exec(cc ?? '')
  return m ? parseInt(m[1], 10) : 0
}

/**
 * Returns null if cacheable, else a short skip reason (S17 observability —
 * exposed as `x-fp-edge-skip` so a silent store-refusal is diagnosable from
 * any browser instead of requiring a deploy cycle per hypothesis).
 */
function storeSkipReason(response) {
  if (response.status !== 200) return 'status'
  if (response.headers.has('set-cookie')) return 'set-cookie'
  const cc = response.headers.get('cache-control') ?? ''
  if (/private|no-store|no-cache/i.test(cc)) return 'cc-private'
  // s-maxage missing on public HTML is synthesized below — not a skip reason
  return null
}

/** Synthesize s-maxage on responses that are public but missing one (e.g. OpenNext
 *  emits no s-maxage on some ISR routes). Only applied to HTML pages on non-API paths. */
function synthesizeCacheControl(response, request) {
  const ct = response.headers.get('content-type') ?? ''
  if (!ct.includes('text/html')) return response
  const { pathname } = new URL(request.url)
  if (pathname.startsWith('/api/')) return response
  const cc = response.headers.get('cache-control') ?? ''
  if (sharedTtl(cc) > 0) return response // already has s-maxage, leave it
  const out = new Response(response.body, response)
  out.headers.set('cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  return out
}

function withEdgeHeader(response, value) {
  const out = new Response(response.body, response)
  out.headers.set('x-fp-edge', value)
  return out
}

export default {
  async fetch(request, env, ctx) {
    // www → naked redirect (S31, 2026-06-17): both custom_domain routes point
    // at this worker, so Page Rules can't intercept. Redirect must happen here.
    const url = new URL(request.url)
    if (url.hostname === 'www.figurepinner.com') {
      url.hostname = 'figurepinner.com'
      return Response.redirect(url.toString(), 301)
    }

    /** Fire-and-forget analytics write — never blocks the response. */
    function recordEdge(status) {
      if (!env.ANALYTICS) return
      const { pathname } = new URL(request.url)
      ctx.waitUntil(Promise.resolve().then(() => {
        env.ANALYTICS.writeDataPoint({
          blobs: [status, pathname.split('/')[1] || 'home'],
          doubles: [1],
          indexes: [status],
        })
      }))
    }

    if (!isCacheableRequest(request)) {
      const res = await handler.fetch(request, env, ctx)
      recordEdge('BYPASS')
      return withEdgeHeader(res, 'BYPASS')
    }

    const cache = caches.default
    const key = cacheKeyFor(request)

    const hit = await cache.match(key)
    if (hit) {
      recordEdge('HIT')
      return withEdgeHeader(hit, 'HIT')
    }

    const res = await handler.fetch(request, env, ctx)
    const res2 = synthesizeCacheControl(res, request)

    const skip = storeSkipReason(res2)
    let putDebug = null
    if (!skip) {
      // Cap HTML TTL so deploys propagate; keep route-chosen TTL for JSON etc.
      const isHtml = (res2.headers.get('content-type') ?? '').includes('text/html')
      const ttl = Math.min(sharedTtl(res2.headers.get('cache-control')), isHtml ? HTML_TTL_CAP : Infinity)
      const stored = new Response(res2.clone().body, res2)
      stored.headers.set('cache-control', `public, s-maxage=${ttl}`)
      stored.headers.set('x-fp-edge-stored', new Date().toISOString())
      if (request.headers.get('x-fp-debug') === '1') {
        // Debug mode (S17): await the put and surface its outcome, because a
        // rejected put inside waitUntil+catch is otherwise invisible. Only
        // fires when the caller explicitly asks; normal traffic keeps the
        // non-blocking waitUntil path.
        try {
          await cache.put(key, stored)
          putDebug = 'ok'
        } catch (e) {
          putDebug = String((e && e.message) || e).slice(0, 140)
        }
      } else {
        ctx.waitUntil(cache.put(key, stored).catch(() => { /* cache write failure must never affect the response */ }))
      }
    }

    recordEdge('MISS')
    const out = withEdgeHeader(res2, 'MISS')
    if (skip) out.headers.set('x-fp-edge-skip', skip)
    if (putDebug) out.headers.set('x-fp-put', putDebug)
    return out
  },
}

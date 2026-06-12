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
 *
 * Rollback: set `main = ".open-next/worker.js"` in wrangler.toml + redeploy.
 */
import handler from './.open-next/worker.js'

// OpenNext Durable Object classes must stay exported from the entry module.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'

/**
 * Signed-in detection (S15 refinement): Clerk sets `__client_uat=0` on EVERY
 * visitor including signed-out ones, so "any Clerk cookie" would bypass all
 * human traffic. Auth = a __session JWT, or __client_uat with a NONZERO value
 * (Clerk's own signed-in marker). `__client_uat=0` explicitly means no session.
 */
function hasAuthCookie(cookie) {
  if (/(?:^|;\s*)__session/.test(cookie)) return true
  for (const m of cookie.matchAll(/(?:^|;\s*)__client_uat(?:_[^=;]+)?=(\d+)/g)) {
    if (m[1] !== '0') return true
  }
  return false
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
  if (sharedTtl(cc) <= 0) return 'no-smaxage'
  return null
}

function withEdgeHeader(response, value) {
  const out = new Response(response.body, response)
  out.headers.set('x-fp-edge', value)
  return out
}

export default {
  async fetch(request, env, ctx) {
    if (!isCacheableRequest(request)) {
      const res = await handler.fetch(request, env, ctx)
      return withEdgeHeader(res, 'BYPASS')
    }

    const cache = caches.default
    const key = cacheKeyFor(request)

    const hit = await cache.match(key)
    if (hit) return withEdgeHeader(hit, 'HIT')

    const res = await handler.fetch(request, env, ctx)

    const skip = storeSkipReason(res)
    let putDebug = null
    if (!skip) {
      // Cap HTML TTL so deploys propagate; keep route-chosen TTL for JSON etc.
      const isHtml = (res.headers.get('content-type') ?? '').includes('text/html')
      const ttl = Math.min(sharedTtl(res.headers.get('cache-control')), isHtml ? HTML_TTL_CAP : Infinity)
      const stored = new Response(res.clone().body, res)
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

    const out = withEdgeHeader(res, 'MISS')
    if (skip) out.headers.set('x-fp-edge-skip', skip)
    if (putDebug) out.headers.set('x-fp-put', putDebug)
    return out
  },
}

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// The site is public. The former coming-soon gate (COMING_SOON_MODE / bypass
// token / coming-soon rewrite) has been removed entirely so it can never gate
// the site again. Auth-protection for /app and /admin remains below.

// Authenticated dashboard routes
const isProtectedRoute = createRouteMatcher(['/app(.*)', '/admin(.*)'])

// ──────────────────────────────────────────────────────────────────────────────
// API NO-CACHE HEADERS
// ──────────────────────────────────────────────────────────────────────────────
// Scrapers from low-value geos (Vietnam, Iraq, Bangladesh, etc) were hitting
// /api/* endpoints at high volume — see CF traffic analytics 2026-06-05.
// CF Pages was happily edge-caching successful API responses, meaning each
// scraper's first request populated the cache and every subsequent scraper
// got a cheap CDN hit. Setting no-store at every CF tier forces each request
// to go back to the worker (which can then be WAF-challenged).
//
// `Cache-Control` covers browsers + most CDNs.
// `CDN-Cache-Control` is the multi-tier directive.
// `Cloudflare-CDN-Cache-Control` is CF-specific override (wins on CF).
function setNoCacheOnApi(): NextResponse {
  const res = NextResponse.next()
  res.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
  res.headers.set('CDN-Cache-Control', 'no-store')
  res.headers.set('Cloudflare-CDN-Cache-Control', 'no-store')
  return res
}

// Public, read-only GET endpoints that set their own Cache-Control and SHOULD be
// CDN-cacheable. The blanket no-store above was stomping these (Genta audit
// 2026-06-06 P1 / H1), forcing every search keystroke, deals load and sparkline
// batch back to the worker uncached. We allowlist them so their route-level
// Cache-Control survives; everything else (vault, alerts, wantlist, user-settings,
// stripe, me, devices, admin, and any new route) stays no-store by default.
// Default-deny: a route is only cacheable if it's explicitly listed here.
const isPublicCacheableApi = createRouteMatcher([
  '/api/v1/search',
  '/api/v1/price-check',
  '/api/news',
  '/api/v1/deals',
  '/api/sparklines',
  '/api/upc',
  '/api/healthz',
  '/api/waitlist/count',
])

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl

  // ─── Standard Clerk protection for /app/* and /admin/* ─────────────────────
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // ─── No-cache headers on /api/* responses (default-deny) ───────────────────
  // Must come after the auth gate so a rejected request isn't
  // accidentally served cached. Public read-only GETs in the allowlist keep
  // their own Cache-Control (CDN-cacheable); everything else gets no-store so
  // authed/mutating data is never edge-cached. GET-only as a belt-and-suspenders
  // guard — a write verb to an allowlisted path still falls through to no-store.
  if (url.pathname.startsWith('/api/')) {
    if (req.method === 'GET' && isPublicCacheableApi(req)) {
      return NextResponse.next()
    }
    return setNoCacheOnApi()
  }
})

export const config = {
  // S17 (2026-06-10): public read-only GET APIs are EXCLUDED from the matcher
  // entirely. clerkMiddleware processes every matched response and that was
  // suspected of attaching Set-Cookie, which makes the S15 edge-cache wrapper
  // refuse to store them (set-cookie gate) — so the allowlist above never
  // actually produced edge HITs. These routes need no auth context; skipping
  // the middleware gives them clean responses. Default-deny is preserved: any
  // NEW /api route is matched (→ no-store) unless explicitly excluded here
  // AND allowlisted above.
  //
  // S19 (2026-06-11): added v1/figure/, alerts/unsubscribe, waitlist/subscribe
  // to exclusion list. These are public no-auth routes that were generating
  // spurious Clerk subrequests (67% 4xx, +107ms latency) on anon/bot traffic.
  // Auth-needing paths (alerts, vault, wantlist, stripe, user-settings, me,
  // devices, admin) remain matched and go through Clerk as before.
  //
  // S20 (2026-06-12): added genre-line-figures — public KB-static rows for the
  // genre-page accordion (payload cut); sets its own s-maxage for the edge cache.
  //
  // S44 (2026-07-01): added funnel — anonymous first-party beacon. It sets
  // no-store itself and should not pay Clerk middleware cost on ad traffic.
  matcher: [
    '/app(.*)',
    '/admin(.*)',
    '/trpc(.*)',
    '/api/((?!v1/search$|v1/price-check$|v1/deals$|news$|sparklines$|upc$|healthz$|waitlist/count$|genre-line-figures$|funnel$|v1/figure/|alerts/unsubscribe|waitlist/subscribe).*)',
  ],
}

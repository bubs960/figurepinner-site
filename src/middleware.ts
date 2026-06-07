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
  '/api/news',
  '/api/v1/deals',
  '/api/sparklines',
  '/api/upc',
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
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

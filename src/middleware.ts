import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'
import { isFigurePageRoute, needsClerkPipeline } from '@/lib/routeClassification'

// The site is public. The former coming-soon gate (COMING_SOON_MODE / bypass
// token / coming-soon rewrite) has been removed entirely so it can never gate
// the site again. Auth-protection for /app and /admin remains below.

// Authenticated dashboard routes
// '/admin(.*)' doesn't cover '/api/admin/*' — add it so new admin API routes
// are gated by default instead of relying on each route to self-guard.
const isProtectedRoute = createRouteMatcher(['/app(.*)', '/admin(.*)', '/api/admin(.*)'])

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

// ──────────────────────────────────────────────────────────────────────────────
// FIGURE-PAGE-HTML RATE LIMIT (Data Defense Layer 2, 2026-07-18)
// ──────────────────────────────────────────────────────────────────────────────
// Threat: HobbyPlatforms-class competitors bulk-ripping the KB + real eBay
// sold-comp data via the ~22,790 figure detail pages (see
// STANDALONE-DATA-DEFENSE-WORK-ORDER-2026-07-18.md). Before this, ONLY the
// JSON API endpoints (/api/v1/search, /api/v1/figure/*, /api/sparklines) had
// any per-IP throttle — the actual rendered HTML pages had none.
//
// 100 req/min/IP: generous enough that no real human or Googlebot could ever
// hit it (a real visitor loads a handful of pages/minute), but slow enough
// that ripping the full ~22,790-figure catalog from one IP takes 3.8+ hours
// instead of minutes — "a polite-crawl cap ... hurts no human, no Googlebot,"
// per the work order's own framing. No public page can be made unscrapeable;
// this makes it slow and loud, not impossible. `checkRateLimit`'s verified-bot
// exemption (`.cf.verifiedBotCategory`) is UNCONDITIONAL — Googlebot, Bingbot,
// etc. are never throttled regardless of volume.
//
// Deliberately bypasses `clerkMiddleware` entirely for these paths — see the
// S19 comment on `config.matcher` below: routing this exact traffic class
// (anonymous, heavily bot-crawled, public) through Clerk's session-resolution
// cost +107ms/67% 4xx last time it was tried, which is why v1/figure/ and
// friends are EXCLUDED from the Clerk matcher already. `isFigurePageRoute` is
// checked, and `handleFigurePageRateLimit` returns, BEFORE `clerkHandler` is
// ever invoked — Clerk's own machinery never runs for a figure-page request.
// `isFigurePageRoute`/`needsClerkPipeline` themselves live in
// src/lib/routeClassification.ts (2026-07-19) so the pure classification
// logic can be unit-tested without pulling in @clerk/nextjs/server, which
// cannot be imported from plain Node — see
// tests/middlewareRouteClassification.test.mjs for the regression guard
// (a reserved-prefix path like /api/admin/health used to be misclassified
// as a figure page here, which would have 500'd every request on deploy).
const FIGURE_PAGE_RATE_LIMIT_PER_MINUTE = 100

async function handleFigurePageRateLimit(req: NextRequest): Promise<NextResponse> {
  const rl = await checkRateLimit(req, 'figure-page', FIGURE_PAGE_RATE_LIMIT_PER_MINUTE)
  if (rl.limited) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter), 'Cache-Control': 'no-store' },
    })
  }
  return NextResponse.next()
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
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

// `/:genre/:line/:slug` (added to config.matcher below) structurally ALSO
// matches the character-hub page `/[genre]/character/[slug]` — same 3-segment
// shape, `isFigurePageRoute` correctly excludes it, but that means it falls
// through to HERE. It must NOT then go to `clerkHandler`: this route was
// NEVER matched before this change (character hubs have no auth/API
// relevance), and routing it through Clerk's session-resolution wrapper
// regardless of what runs inside is exactly the S19 cost (found live during
// this change's own verification: a genuinely different bug from the one
// S19 originally fixed, same root cause — a newly-widened matcher pulling an
// unrelated public page into the Clerk pipeline). Only forward to Clerk for
// paths that actually need it; everything else the widened matcher now also
// catches passes straight through, matching its pre-change behavior exactly.

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const pathname = req.nextUrl.pathname
  if (isFigurePageRoute(pathname)) {
    return handleFigurePageRateLimit(req)
  }
  if (needsClerkPipeline(pathname)) {
    return clerkHandler(req, event)
  }
  return NextResponse.next()
}

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
  // S44 (2026-07-01): added funnel — anonymous first-party beacon. It sets
  // no-store itself and should not pay Clerk middleware cost on ad traffic.
  //
  // S53 (2026-07-03): removed genre-line-figures from the exclusion — the route
  // was deleted (its only caller, the genre-page accordion, was dead code).
  matcher: [
    '/app(.*)',
    '/admin(.*)',
    '/trpc(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/((?!v1/search$|v1/price-check$|v1/deals$|news$|sparklines$|upc$|healthz$|waitlist/count$|funnel$|v1/figure/|alerts/unsubscribe|waitlist/subscribe).*)',
    // Data Defense Layer 2 (2026-07-18): figure detail pages, matched so
    // `isFigurePageRoute` + `handleFigurePageRateLimit` can run — but see the
    // function above, this branch returns BEFORE `clerkHandler`/Clerk's own
    // middleware logic is ever invoked, so this does NOT reintroduce the S19
    // regression (this traffic still never touches Clerk).
    '/figure/:figure_id',
    '/:genre/:line/:slug',
  ],
}
// /sign-in and /sign-up added (S71, 2026-07-08): both layouts use
// <ClerkProvider dynamic>, which per Clerk's own docs requires per-request
// clerkMiddleware evaluation to work correctly -- neither route was in this
// matcher, so that requirement was silently unmet. Live customer report same
// day: sign-up -> verify -> stuck in a redirect loop back to sign-in, which
// matches Clerk's documented "infinite redirect loop" failure class (unable
// to determine auth state for the request). NOT a repeat of the S19 public-
// page-latency regression this matcher otherwise guards against -- sign-in/
// sign-up are `robots: noindex`, low-traffic, and are exactly the auth-
// critical routes Clerk's own quickstart matcher covers by default; S19 was
// specifically about high-volume BOT-CRAWLED, INDEXED content pages (genre
// hubs, guides), which this change does not touch.

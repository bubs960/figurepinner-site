import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// ──────────────────────────────────────────────────────────────────────────────
// COMING-SOON GATE
// ──────────────────────────────────────────────────────────────────────────────
// While we build pricing coverage to our launch threshold (60%), the site is
// gated. Public visitors see /coming-soon for any URL. Internal testers bypass
// by visiting any URL with `?early=<COMING_SOON_BYPASS>` once — that sets a
// 30-day cookie and lets them roam the full site freely.
//
// To open the site to the public:
//   - Set env var COMING_SOON_MODE = "false" in .env.production and redeploy.
//   - OR delete this gate block.
//
// To rotate the bypass secret (revoke old links): change COMING_SOON_BYPASS.
// ──────────────────────────────────────────────────────────────────────────────

const COMING_SOON_MODE = process.env.COMING_SOON_MODE !== 'false'
const COMING_SOON_BYPASS = 'fp_alpha_2026'
const COMING_SOON_COOKIE = 'fp_early_access'

// Routes that ALWAYS pass through (even in coming-soon mode):
//   - /coming-soon: the public-facing page itself
//   - /api/*: server APIs (extension/internal callers, waitlist signup)
//   - /.well-known/*: deep-link manifests (AASA, assetlinks)
const isAllowedThroughComingSoon = createRouteMatcher([
  '/coming-soon',
  '/api/(.*)',
  '/.well-known/(.*)',
  // /news is public read-only content. Selectively open it through the
  // coming-soon gate so search engines can index news posts as they're
  // published. Authenticated dashboard routes (/app/*) and the rest of
  // the site stay gated until the global flag flips.
  '/news',
  '/news/(.*)',
])

// Authenticated dashboard routes
const isProtectedRoute = createRouteMatcher(['/app(.*)', '/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl

  // ─── Coming-soon gate ──────────────────────────────────────────────────────
  if (COMING_SOON_MODE) {
    const earlyParam = url.searchParams.get('early')
    const cookieValue = req.cookies.get(COMING_SOON_COOKIE)?.value

    // Bypass via query param: set cookie, strip param, redirect to clean URL
    if (earlyParam === COMING_SOON_BYPASS) {
      const cleanUrl = new URL(url)
      cleanUrl.searchParams.delete('early')
      const res = NextResponse.redirect(cleanUrl)
      res.cookies.set(COMING_SOON_COOKIE, COMING_SOON_BYPASS, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax',
        secure: true,
        path: '/',
      })
      return res
    }

    const hasBypass = cookieValue === COMING_SOON_BYPASS

    // No bypass and not in allowlist? Rewrite to coming-soon (URL stays same)
    if (!hasBypass && !isAllowedThroughComingSoon(req)) {
      return NextResponse.rewrite(new URL('/coming-soon', req.url))
    }
  }

  // ─── Standard Clerk protection for /app/* ──────────────────────────────────
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

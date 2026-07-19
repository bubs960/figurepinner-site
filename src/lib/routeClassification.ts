// Pure route-classification helpers for src/middleware.ts, split into their
// own zero-dependency module (2026-07-19) so they can be unit-tested directly
// -- middleware.ts pulls in @clerk/nextjs/server, which cannot be imported
// from plain Node (ERR_MODULE_NOT_FOUND on the package's own export map),
// the same reason edge-cache-policy.mjs exists separately from
// edge-cache-entry.mjs. See tests/middlewareRouteClassification.test.mjs.

// Paths that must always go through Clerk's middleware pipeline. Single
// source of truth: `isFigurePageRoute` below defers to this FIRST so a
// reserved prefix can never be misclassified as a figure-page route no
// matter what segment shape it happens to have.
export function needsClerkPipeline(pathname: string): boolean {
  return (
    pathname.startsWith('/app') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/trpc') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up')
  )
}

// Data Defense Layer 2 (2026-07-18): identifies the public figure-detail
// page shape (/figure/[id] and /[genre]/[line]/[slug]) so it can be routed
// to the rate limiter and skip Clerk entirely (see middleware.ts).
//
// 2026-07-19 (adversarial-verify catch on commit bad33cd): this used to
// check segment COUNT ONLY, which structurally also matched reserved
// 3-segment paths -- /api/admin/health, /api/vault/[id], /api/wantlist/[id],
// /api/alerts/[id] are all 3 segments too. Those got misclassified as figure
// pages, skipped Clerk, and would have 500'd on deploy (Clerk's `auth()`
// throws when clerkMiddleware never wrapped the request). The
// `needsClerkPipeline` guard closes that hole.
export function isFigurePageRoute(pathname: string): boolean {
  if (needsClerkPipeline(pathname)) return false
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] === 'figure' && segments.length === 2) return true
  // [genre]/[line]/[slug] is the figure detail page (exactly 3 segments).
  // [genre]/character/[slug] is ALSO 3 segments but is the character-hub
  // page (aggregates every release of a character) — not a figure detail
  // page, explicitly excluded so it isn't throttled or double-counted here.
  if (segments.length === 3 && segments[1] !== 'character') return true
  return false
}

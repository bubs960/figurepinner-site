/**
 * edge-cache-policy.mjs — pure cache-decision logic for edge-cache-entry.mjs,
 * split out 2026-07-15 so it can be unit-tested in plain Node.
 *
 * edge-cache-entry.mjs imports .open-next/worker.js, which imports
 * `cloudflare:*` runtime built-ins (workers-runtime-only schemes) several
 * layers down. That makes edge-cache-entry.mjs itself unimportable from a
 * plain `node --test` run (ERR_UNSUPPORTED_ESM_URL_SCHEME) -- confirmed both
 * in the sandbox used to build this fix AND on Steve's machine, so it's a
 * real constraint, not an environment fluke. This module has NO Workers
 * imports and operates only on standard Request/Response, so it can be
 * imported directly by tests/edgeCacheOrdering.test.mjs without dragging in
 * the OpenNext worker at all.
 */

import { needsClerkPipeline } from './src/lib/routeClassification.ts'

const HTML_TTL_CAP = 86400
export const NOT_FOUND_TTL = 900

/**
 * Release M (2026-09-04, speed program S2, item 2): origin-500 shield for the
 * KB-reading PAGE routes.
 *
 * WHY: a D1 blip ("D1 DB is overloaded", "storage operation exceeded timeout
 * which caused object to be reset" -- four windows on 9/2, one at 13:51Z 9/3)
 * surfaces from kbDb.ts as an uncaught exception BY DESIGN (a caught error
 * would render a false 404 and cache it for 24 h -- figure/[figure_id]/page.tsx
 * header). Warm pages are already safe: OpenNext serves the stale KV entry and
 * revalidates in the background. A COLD page during the blip is the gap: the
 * visitor gets Next's opaque 500, which nothing retries. This turns that exact
 * case into a 503 + Retry-After + no-store, so a browser/crawler retries in
 * half a minute and no cache layer can hold an error page.
 *
 * SCOPE (allowlist, not a segment count -- /guides/[slug], /about, /deals and
 * friends sit at the same URL depths as hubs and must never match):
 *   /figure/[id]                          /figure/[id]/opengraph-image
 *   /[genre]                              /[genre]/[line]  (+ /page/N)
 *   /[genre]/character/[slug] (+ /page/N) /[genre]/[line]/[slug]
 *   /[genre]/[line]/[slug]/opengraph-image
 * where [genre] MUST be in the caller-supplied genre-slug set (built at entry
 * load from kb-stats.generated.json, a build-time artifact -- no D1). Reserved
 * prefixes (/app, /admin, /api, ...) are refused first via needsClerkPipeline.
 * kbDb.ts, the rate limiter, the store/skip decisions above and the admin
 * fail-closed paths are untouched (R16).
 */
export const ORIGIN_SHIELD_RETRY_AFTER = 30

function isPageNumber(seg) {
  return /^[1-9]\d*$/.test(seg ?? '')
}

export function isKbPageRoute(pathname, genreSlugs) {
  if (needsClerkPipeline(pathname)) return false
  const s = pathname.split('/').filter(Boolean)
  if (s.length === 0) return false
  if (s[0] === 'figure') {
    return s.length === 2 || (s.length === 3 && s[2] === 'opengraph-image')
  }
  if (!genreSlugs.has(s[0])) return false
  if (s.length === 1) return true
  if (s[1] === 'character') {
    return s.length === 3 || (s.length === 5 && s[3] === 'page' && isPageNumber(s[4]))
  }
  if (s.length === 2) return true
  if (s.length === 3) return true
  if (s.length === 4) return (s[2] === 'page' && isPageNumber(s[3])) || s[3] === 'opengraph-image'
  return false
}

/**
 * Given the origin response for a non-bypass GET, return the response to
 * serve: the original in every case except a 500 on a KB page route, which
 * becomes an uncacheable 503. Never throws; never touches non-500s.
 */
export function shieldOrigin500(response, request, genreSlugs) {
  if (response.status !== 500) return response
  const { pathname } = new URL(request.url)
  if (!isKbPageRoute(pathname, genreSlugs)) return response
  return new Response(
    '<!doctype html><meta charset="utf-8"><title>Temporarily unavailable</title>' +
    '<p>This page is briefly unavailable while our price database catches up. It retries automatically in about half a minute.</p>',
    {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'retry-after': String(ORIGIN_SHIELD_RETRY_AFTER),
        'x-fp-shield': 'origin-500',
      },
    },
  )
}

/** Positive s-maxage from a Cache-Control header, else 0. */
export function sharedTtl(cc) {
  const m = /s-maxage=(\d+)/.exec(cc ?? '')
  return m ? parseInt(m[1], 10) : 0
}

/**
 * Returns null if cacheable, else a short skip reason (S17 observability --
 * exposed as `x-fp-edge-skip` so a silent store-refusal is diagnosable from
 * any browser instead of requiring a deploy cycle per hypothesis).
 */
export function isPublicHtmlNotFound(response, request) {
  if (response.status !== 404) return false
  const ct = response.headers.get('content-type') ?? ''
  if (!ct.includes('text/html')) return false
  const { pathname } = new URL(request.url)
  if (pathname.startsWith('/api/')) return false
  return true
}

// KV-consolidation known-bug allowance (2026-08-07): middleware.ts rewrites
// /figure/:id -> a figure's pretty path when one exists (rewriteFigureIdToPrettyPath,
// added 2026-07-22 to make both URL shapes share one cache entry). The REWRITTEN
// render comes back from OpenNext as Cache-Control: private/no-store/no-cache
// instead of inheriting the pretty page's real public s-maxage -- verified live,
// 100% reproducible, zero relation to auth (confirmed with cookie-free requests).
// The identical content hit directly at its pretty URL caches correctly, so this
// is an OpenNext rewrite-vs-ISR quirk, not a genuine privacy signal: figure detail
// pages never depend on auth/session state at render time (middleware.ts bypasses
// Clerk entirely for this exact route class, Data Defense Layer 2). Scoped to
// EXACTLY the raw-ID shape (2 segments, first is "figure") so it can never touch
// the pretty-path route itself (already correct) or any other route -- the
// set-cookie gate above still runs first and is untouched by this allowance.
// Full investigation: board/OPEN-ITEMS-web.md (2026-08-07),
// WEB-TO-STANDALONE-DAILY-HEALTH-CHECK6-FALSE-DIAGNOSIS-2026-08-07.md.
function isKnownSafeDespitePrivate(request) {
  const { pathname } = new URL(request.url)
  const segments = pathname.split('/').filter(Boolean)
  return segments[0] === 'figure' && segments.length === 2
}

export function storeSkipReason(response, request) {
  if (response.headers.has('set-cookie')) return 'set-cookie'
  const cc = response.headers.get('cache-control') ?? ''
  if (/private|no-store|no-cache/i.test(cc) && !isKnownSafeDespitePrivate(request)) return 'cc-private'
  if (isPublicHtmlNotFound(response, request)) return null
  if (response.status !== 200) return 'status'
  // s-maxage missing on public HTML is synthesized below -- not a skip reason
  return null
}

export function storeTtl(response, request) {
  if (isPublicHtmlNotFound(response, request)) return NOT_FOUND_TTL
  const isHtml = (response.headers.get('content-type') ?? '').includes('text/html')
  return Math.min(sharedTtl(response.headers.get('cache-control')), isHtml ? HTML_TTL_CAP : Infinity)
}

/** Synthesize s-maxage on responses that are public but missing one (e.g. OpenNext
 *  emits no s-maxage on some ISR routes). Only applied to HTML pages on non-API paths. */
export function synthesizeCacheControl(response, request) {
  const ct = response.headers.get('content-type') ?? ''
  if (!ct.includes('text/html')) return response
  const { pathname } = new URL(request.url)
  if (pathname.startsWith('/api/')) return response
  const cc = response.headers.get('cache-control') ?? ''
  if (sharedTtl(cc) > 0) return response // already has s-maxage, leave it
  const out = new Response(response.body, response)
  if (response.status === 404) {
    out.headers.set('cache-control', `public, s-maxage=${NOT_FOUND_TTL}, stale-while-revalidate=3600`)
  } else {
    // 2026-09-02 (webaudit hub deep-dive, breakthrough 1): the raw-fid /figure/:id
    // shape is served through the KV-consolidation rewrite (middleware.ts), whose
    // render comes back `private` with no s-maxage, so it landed here and got the
    // generic hour even though figure/[figure_id]/page.tsx asks for revalidate=86400
    // -- the 9,973 sitemap-submitted /figure/fp_* URLs cached 1/24th as long as
    // intended. Same allowance predicate as the store decision, so the scope is
    // exactly that shape; every other public HTML page keeps the generic hour.
    const ttl = isKnownSafeDespitePrivate(request) ? HTML_TTL_CAP : 3600
    out.headers.set('cache-control', `public, s-maxage=${ttl}, stale-while-revalidate=86400`)
  }
  return out
}
